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
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None

    def process_meeting_text(self, text: str) -> Dict[str, Any]:
        """Process meeting text using Google Gemini AI"""
        
        if not self.model:
            raise Exception("API Key do Google Gemini não configurada")
        
        try:
            print("🤖 Processando com Google Gemini...")
            
            prompt = f"""
Analise o seguinte texto de reunião e extraia as informações estruturadas.

TEXTO DA REUNIÃO:
```
{text}
```
---
### INSTRUÇÕES RÍGIDAS

1.  **OBJETIVO:** Extrair TODAS as sub-tarefas granulares. Não agrupe tarefas.
2.  **GRANULARIDADE:** Se um item principal for dividido em tarefas de "Back-end", "Front-end", "QA", ... , você DEVE criar um item JSON separado para CADA UMA dessas tarefas.
3.  **NÃO AGRUPAR:** A descrição de uma tarefa NÃO DEVE conter listas (com "1.", "2.", etc.). Se você vir uma lista, cada item dela é uma tarefa separada.
4.  **ASSIGNEE:** Atribua o nome da pessoa (ex: "Ana", "Léo", "Tiago") se o texto a mencionar junto à tarefa.
6.  **SEGUIR O EXEMPLO:** O formato de saída DEVE seguir o exemplo abaixo.

---
### EXEMPLO DE SAÍDA DESEJADA

Se o texto diz:
"[10:03] Ana (Dev BE): Eu lembro. Pelo back-end, temos: 1. Criar o endpoint. 2. Criar o webhook."

O JSON de saída para essa parte DEVE ser:
```json
  "tasks": [
    {{
      "title": "BE: Criar o endpoint",
      "description": "Criar o endpoint para gerar o QR Code PIX (integração com a API do gateway).",
      "priority": "Alta",
      "assignee": "Ana",
      "due_date": null,
      "parent_pbi": "PBI-450"
    }},
    {{
      "title": "BE: Criar o webhook",
      "description": "Criar o webhook para receber a confirmação de pagamento do gateway.",
      "priority": "Alta",
      "assignee": "Ana",
      "due_date": null,
      "parent_pbi": "PBI-450"
    }}
  ]
"""
            
            print(f"⏳ Enviando para Gemini (pode levar alguns segundos)...")
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up response text
            if response_text.startswith("```json"):
                response_text = response_text.replace("```json", "").replace("```", "").strip()
            elif response_text.startswith("```"):
                response_text = response_text.replace("```", "").strip()
            
            print(f"📝 Resposta da IA recebida, parseando JSON...")
            result = json.loads(response_text)

            # Garantir que campos esperados existam mesmo se a IA omitir algo
            if not isinstance(result.get("summary"), str):
                result["summary"] = "Resumo não informado pela IA."
            if not isinstance(result.get("key_points"), list):
                result["key_points"] = []
            if not isinstance(result.get("tasks"), list):
                result["tasks"] = []

            # Normalizar tarefas para evitar quebra ao salvar/serializar
            normalized_tasks = []
            for task in result["tasks"]:
                task_data = {
                    "title": task.get("title") or "Tarefa sem título",
                    "description": task.get("description") or "",
                    "priority": task.get("priority") or "Média",
                    "assignee": task.get("assignee"),
                    "due_date": task.get("due_date")
                }
                # Preservar ID enviado pela IA se existir
                if task.get("id"):
                    task_data["id"] = task["id"]
                normalized_tasks.append(task_data)
            result["tasks"] = normalized_tasks

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