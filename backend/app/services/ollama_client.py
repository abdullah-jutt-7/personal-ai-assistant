from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from backend.app.core.config import settings


SYSTEM_PROMPT = (
    "You are IntelliText, a helpful, calm, and intelligent personal AI assistant. "
    "Your job is to answer the user's last message clearly, helpfully, and concisely. "
    "Use any provided memory or context only when it helps the user. "
    "If asked your name, say IntelliText."
)


async def generate_reply(messages: list[dict[str, str]]) -> str:
    payload = {
        "model": settings.ollama_model,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(f"{settings.ollama_base_url}/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()

    return data["message"]["content"].strip()


async def stream_reply(messages: list[dict[str, str]]) -> AsyncIterator[dict[str, str]]:
    payload = {
        "model": settings.ollama_model,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_base_url}/api/chat",
            json=payload,
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line.strip():
                    continue

                data = json.loads(line)
                message = data.get("message") or {}
                content = message.get("content") or ""
                thinking = message.get("thinking") or ""

                if thinking:
                    yield {"type": "thinking", "delta": thinking}

                if content:
                    yield {"type": "content", "delta": content}

                if data.get("done"):
                    yield {"type": "done", "content": content}
