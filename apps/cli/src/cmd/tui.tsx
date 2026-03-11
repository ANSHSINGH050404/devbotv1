import React, { useEffect, useMemo, useState } from "react";
import { render, Box, Text } from "ink";
import TextInput from "ink-text-input";

type ChatRole = "user" | "assistant" | "system" | "tool";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ToolEvent = {
  name: string;
  args: unknown;
  result: unknown;
};

type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tool"; name: string; args: unknown; result: unknown }
  | { type: "final"; message: { role: string; content?: string } };

function useChatRuntime(baseUrl: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tools, setTools] = useState<ToolEvent[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendPrompt = async (prompt: string) => {
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: prompt },
    ];
    setMessages(nextMessages);
    setStreamingText("");
    setIsStreaming(true);

    const res = await fetch(`${baseUrl}/run/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });

    if (!res.body) {
      setIsStreaming(false);
      setMessages((prev: ChatMessage[]) => [
        ...prev,
        { role: "assistant", content: "No response body from server." },
      ]);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          setIsStreaming(false);
          if (streamingText.trim()) {
          setMessages((prev: ChatMessage[]) => [
            ...prev,
            { role: "assistant", content: streamingText },
          ]);
          }
          setStreamingText("");
          continue;
        }

        try {
          const evt = JSON.parse(data) as StreamEvent;
          if (evt.type === "token") {
            setStreamingText((prev: string) => prev + evt.text.replace(/\\n/g, "\n"));
          } else if (evt.type === "tool") {
            setTools((prev: ToolEvent[]) => [
              ...prev,
              { name: evt.name, args: evt.args, result: evt.result },
            ]);
          } else if (evt.type === "final") {
            if (evt.message?.content) {
              setMessages((prev: ChatMessage[]) => [
                ...prev,
                { role: "assistant", content: evt.message.content || "" },
              ]);
            }
            setStreamingText("");
            setIsStreaming(false);
          }
        } catch {
          // ignore malformed events
        }
      }
    }
  };

  return { messages, tools, streamingText, isStreaming, sendPrompt };
}

function ChatApp({ baseUrl }: { baseUrl: string }) {
  const [input, setInput] = useState("");
  const { messages, tools, streamingText, isStreaming, sendPrompt } =
    useChatRuntime(baseUrl);

  const history = useMemo(() => messages.slice(-100), [messages]);

  return (
    <Box flexDirection="column">
      <Text>Dev Agent TUI</Text>
      <Text>Runtime: {baseUrl}</Text>
      <Box flexDirection="column" marginTop={1}>
        {history.map((msg: ChatMessage, idx: number) => (
          <Text key={idx}>
            [{msg.role}] {msg.content}
          </Text>
        ))}
        {isStreaming && (
          <Text>
            [assistant] {streamingText}
          </Text>
        )}
      </Box>
      {tools.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>Tools:</Text>
          {tools.slice(-5).map((tool: ToolEvent, idx: number) => (
            <Text key={idx}>
              - {tool.name}
            </Text>
          ))}
        </Box>
      )}
      <Box marginTop={1}>
        <Text>{"> "}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={(value) => {
            const trimmed = value.trim();
            if (!trimmed) return;
            setInput("");
            void sendPrompt(trimmed);
          }}
        />
      </Box>
    </Box>
  );
}

export const tuiCommand = {
  command: "tui",
  describe: "Start the interactive TUI",
  handler: async () => {
    const baseUrl = process.env.RUNTIME_URL || "http://localhost:3000";
    render(<ChatApp baseUrl={baseUrl} />);
  },
};
