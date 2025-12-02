"""
Google Gemini AI service for processing meeting text
"""
import google.generativeai as genai
import json
from typing import Dict, Any

from ..core.config import settings

class AIService:
    def __init__(self):
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "SUA_API_KEY_AQUI":
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-2.5-flash")
        else:
            self.model = None

    def process_meeting_text(self, text: str) -> Dict[str, Any]:
        """Process meeting text using Google Gemini AI"""

        if not self.model:
            raise Exception("API Key do Google Gemini não configurada")

        try:
            print("🤖 Processando com Google Gemini...")

            from datetime import date
            today = date.today().isoformat()
            header = f"""
Você é um agente altamente especializado em extrair tarefas de transcrições de reunião.

A transcrição pode estar perfeita, razoável ou muito ruim — contendo gírias, ruídos, frases truncadas, erros de ASR, repetições, interrupções ou informalidades. Ainda assim, você deve interpretar o texto e extrair tarefas válidas.

Contexto temporal: HOJE = {today}

---------------------------------------
TEXTO A SER ANALISADO:
"""

            regras = """
---------------------------------------
# REGRAS OBRIGATÓRIAS

1. EXTRAIA SOMENTE TAREFAS.
   Qualquer instrução futura, pedido de ação, responsabilidade ou atividade mencionada → é uma task.

2. GRANULARIDADE MÁXIMA.
   Se houver listas (“1.”, “2.”, “a)”, “-”), divida em múltiplas tasks.
   Se uma frase contiver várias ações, também deve virar tasks separadas.

3. NÃO AGRUPAR.
   Cada task representa uma única ação.
   A descrição não pode conter listas internas.

4. ASSIGNEE.
   Atribua a pessoa somente se for citada diretamente na tarefa.
   Caso contrário → assignee = null.

5. DUE DATE.
   Se houver indicação de data (“amanhã”, “sexta”, “dia 14”):
     - interpretar para YYYY-MM-DD relativo a HOJE.
     - quando mês/dia forem citados sem ano, ASSUMA a data mais PRÓXIMA no FUTURO.
     - NUNCA gere datas no passado; ajuste ano quando necessário.
   Se não houver → due_date = null.

6. NÃO INVENTAR.
   Não crie tarefas que não existem.
   Não invente datas.
   Não adicione campos extras.

7. RETORNE APENAS O JSON.
   Sem markdown, sem explicações, sem comentários.
"""

            formato = """
---------------------------------------
# FORMATO FINAL OBRIGATÓRIO:

{{
  "tasks": [
    {{
      "title": "Título claro e objetivo da tarefa",
      "description": "Descrição detalhada da tarefa, sem listas internas.",
      "assignee": "Nome ou null",
      "due_date": "YYYY-MM-DD ou null"
    }}
  ]
}}

Se nenhuma tarefa existir, retorne:
{{ "tasks": [] }}
"""
            prompt = f"{header}{text}\n\n{regras}\n\n{formato}"

            print(f"⏳ Enviando para Gemini (pode levar alguns segundos)...")
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            if response_text.startswith("```"):
                response_text = response_text.replace("```json", "").replace("```", "").strip()

            print(f"📝 Resposta da IA recebida, parseando JSON...")
            result = json.loads(response_text)

            # Garante estrutura mínima
            if not isinstance(result.get("tasks"), list):
                result["tasks"] = []

            # Sem summary e key_points: o sistema persiste apenas tasks

            # Normalização das tasks
            normalized_tasks = []
            for task in result["tasks"]:
                task_data = {
                    "title": task.get("title") or "Tarefa sem título",
                    "description": task.get("description") or "",
                    "assignee": task.get("assignee"),
                    "due_date": task.get("due_date")
                }
                normalized_tasks.append(task_data)

            result["tasks"] = normalized_tasks

            try:
                from datetime import datetime, date as _date, timedelta
                import re
                today_d = _date.today()
                weekday_idx = {
                    "segunda": 0,
                    "terca": 1,
                    "terça": 1,
                    "quarta": 2,
                    "quinta": 3,
                    "sexta": 4,
                    "sabado": 5,
                    "sábado": 5,
                    "domingo": 6,
                }
                def normalize_text(s: str) -> str:
                    return (
                        s.lower()
                        .strip()
                        .replace("ç", "c")
                        .replace("ã", "a")
                        .replace("á", "a")
                        .replace("é", "e")
                        .replace("í", "i")
                        .replace("ó", "o")
                        .replace("ú", "u")
                    )
                def next_weekday(idx: int) -> _date:
                    delta = (idx - today_d.weekday()) % 7
                    if delta == 0:
                        delta = 7
                    return today_d + timedelta(days=delta)
                for t in result["tasks"]:
                    d = t.get("due_date")
                    if isinstance(d, str):
                        s = normalize_text(d)
                        if s in ("amanha",):
                            t["due_date"] = (today_d + timedelta(days=1)).isoformat()
                            continue
                        if s in ("hoje",):
                            t["due_date"] = today_d.isoformat()
                            continue
                        if "depois de amanha" in s:
                            t["due_date"] = (today_d + timedelta(days=2)).isoformat()
                            continue
                        for name, idx in weekday_idx.items():
                            if name in s:
                                t["due_date"] = next_weekday(idx).isoformat()
                                break
                        if isinstance(t.get("due_date"), str):
                            pass
                        else:
                            m = re.search(r"em\s*(\d+)\s*dias", s)
                            if m:
                                n = int(m.group(1))
                                t["due_date"] = (today_d + timedelta(days=n)).isoformat()
                                continue
                        try:
                            parsed = datetime.strptime(d[:10], "%Y-%m-%d").date()
                            if parsed < today_d:
                                corrected = parsed.replace(year=today_d.year)
                                if corrected < today_d:
                                    corrected = corrected.replace(year=today_d.year + 1)
                                t["due_date"] = corrected.isoformat()
                        except Exception:
                            pass
            except Exception:
                pass

            print(f"✅ {len(result['tasks'])} tasks encontradas com sucesso!")

            return result

        except json.JSONDecodeError as e:
            print(f"❌ Erro ao fazer parse do JSON: {e}")
            print(f"   Resposta bruta: {response_text[:200]}...")
            raise Exception(f"Erro ao processar resposta da IA: {str(e)}")

        except Exception as e:
            print(f"❌ Erro ao processar com Gemini: {e}")
            raise Exception(f"Erro ao processar com Gemini: {str(e)}")


# Global AI service instance
ai_service = AIService()
