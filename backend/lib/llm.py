"""Claude Code CLI helpers — delegates LLM work to `claude -p`."""

from __future__ import annotations

import json
import logging
import re
import subprocess
from typing import Any

log = logging.getLogger(__name__)


class LLMClient:
    def __init__(self, model: str = "claude-sonnet-4-6"):
        self.model = model

    def complete(self, prompt: str, temperature: float = 0.2, max_tokens: int = 4000) -> str:
        result = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "json", "--model", self.model],
            capture_output=True,
            text=True,
            check=True,
        )
        data = json.loads(result.stdout)
        return data["result"].strip()

    def complete_json(self, prompt: str, temperature: float = 0.0, max_tokens: int = 4000) -> Any:
        text = self.complete(prompt, temperature=temperature, max_tokens=max_tokens)
        return parse_json_response(text)


def parse_json_response(text: str) -> Any:
    cleaned = text.strip()
    cleaned = re.sub(r"^```json\s*", "", cleaned)
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)
