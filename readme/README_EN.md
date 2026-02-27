# ChatGPT Optimizer

![ChatGPT Optimizer Logo](../optimize.png)

ChatGPT Optimizer is a Chrome MV3 extension that keeps ChatGPT responsive in long conversations by reducing heavy history rendering.


## What It Does

- Works only on `https://chatgpt.com/*` and `https://chat.openai.com/*`
- Automatically keeps only the latest messages active in the visible conversation window
- Starts with sensible defaults and runs without manual setup
- Includes quick actions for optimize now, load older, and hot reload
- Shows active status toast with cooldown

## Language Behavior

- Turkish browser UI language (`tr*`) uses Turkish UI
- English browser UI language (`en*`) uses English UI
- Any non-Turkish and non-English UI language falls back to English by default

## What It Does Not Do

- It does not speed up OpenAI servers
- It does not collect or send personal data
- It does not make external network requests for analytics or tracking

## Privacy

- Fully local operation in browser
- No data collection
- No telemetry

## Installation

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the project folder

