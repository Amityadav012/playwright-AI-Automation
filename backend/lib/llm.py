"""Shared OpenAI client helpers."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Optional

from openai import OpenAI

log = logging.getLogger(__name__)


class LLMClient:
    def __init__(self, model: str = "gpt-4o-mini"):
        self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.model = model

    def complete(self, prompt: str, temperature: float = 0.2, max_tokens: int = 4000) -> str:
        return self.complete_messages(
            [{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def complete_messages(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 4000,
    ) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content.strip()

    def complete_json(self, prompt: str, temperature: float = 0.0, max_tokens: int = 4000) -> Any:
        return self.complete_json_messages(
            [{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def complete_json_messages(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.0,
        max_tokens: int = 4000,
    ) -> Any:
        text = self.complete_messages(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return parse_json_response(text)


def parse_json_response(text: str) -> Any:
    cleaned = text.strip()
    cleaned = re.sub(r"^```json\s*", "", cleaned)
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)
