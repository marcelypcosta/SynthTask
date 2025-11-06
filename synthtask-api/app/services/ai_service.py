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

Responda APENAS com um JSON válido no seguinte formato:
{{
  "summary": "Resumo conciso da reunião (2-3 frases)",
  "key_points": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "tasks": [
    {{
      "title": "Título curto da tarefa",
      "description": "Descrição detalhada",
      "priority": "Alta|Média|Baixa",
      "assignee": "Nome da pessoa ou null",
      "due_date": "YYYY-MM-DD ou null"
    }}
  ]
}}
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