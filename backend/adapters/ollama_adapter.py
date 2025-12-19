"""
Ollama AI Adapter
Implements the AIAdapter interface for local Ollama models.
"""
import json
import re
import requests
from requests.exceptions import ConnectionError, Timeout
from typing import Dict, List, Any, Optional

from .base_adapter import AIAdapter, GenerationConfig, Message


class OllamaAdapter(AIAdapter):
    """
    Adapter for Ollama local LLM server.
    """
    
    def __init__(
        self, 
        base_url: str = "http://localhost:11434",
        model: str = "qwen2.5-coder:14b",
        timeout: int = 300,
        api_key: Optional[str] = None
    ):
        base_url = base_url.rstrip('/')
        if base_url.endswith('/api'):
            base_url = base_url[:-4]
        self.base_url = base_url
        self.model = model
        self.timeout = timeout
        self.api_key = api_key
        
    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    @property
    def name(self) -> str:
        return f"ollama/{self.model}"
    
    def is_available(self) -> bool:
        """Check if Ollama server is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except (ConnectionError, Timeout):
            return False
    
    def generate(
        self, 
        prompt: str, 
        system: str = "",
        config: Optional[GenerationConfig] = None
    ) -> Dict[str, Any]:
        """Generate response using Ollama /api/generate endpoint"""
        config = config or GenerationConfig()
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": config.stream,
        }
        
        if system:
            payload["system"] = system
        
        if config.format:
            payload["format"] = config.format
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                return {"error": f"Ollama Error: {response.text}"}
            
            result = response.json()
            content = result.get('response', '')
            
            # If JSON format requested, try to parse
            if config.format == "json":
                return self._parse_json_response(content)
            
            return {"response": content}
            
        except ConnectionError:
            return {"error": "Connection to Ollama refused. Is Ollama running?"}
        except Timeout:
            return {"error": "Ollama request timed out"}
        except Exception as e:
            return {"error": str(e)}
    
    def chat(
        self, 
        messages: List[Message],
        config: Optional[GenerationConfig] = None
    ) -> Dict[str, Any]:
        """Generate response using Ollama /api/chat endpoint"""
        config = config or GenerationConfig()
        
        # Convert Message objects to dicts
        msg_dicts = [{"role": m.role, "content": m.content} for m in messages]
        
        payload = {
            "model": self.model,
            "messages": msg_dicts,
            "stream": config.stream,
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                return {"error": f"Ollama Error: {response.text}"}
            
            result = response.json()
            content = result.get('message', {}).get('content', '')
            
            return {"response": content}
            
        except ConnectionError:
            return {"error": "Connection to Ollama refused. Is Ollama running?"}
        except Timeout:
            return {"error": "Ollama request timed out"}
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        """Parse JSON from response, handling common issues"""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code block
            match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
            if match:
                try:
                    return json.loads(match.group(1).strip())
                except json.JSONDecodeError:
                    pass
            
            # Try to find raw JSON object
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
            
            return {"error": "Failed to parse JSON response", "raw": content}
