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

            header = """
Você é um agente altamente especializado em extrair tarefas de transcrições de reunião.

A transcrição pode estar perfeita, razoável ou muito ruim — contendo gírias, ruídos, frases truncadas, erros de ASR, repetições, interrupções ou informalidades. Ainda assim, você deve interpretar o texto e extrair tarefas válidas.

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
   Se houver indicação de data (“amanhã”, “sexta”, “dia 14”) → interpretar para YYYY-MM-DD.
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

            # Sem derivação adicional

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
