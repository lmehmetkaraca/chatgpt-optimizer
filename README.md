# ChatGPT Optimizer

![ChatGPT Optimizer Logo](./optimize.png)

## English

ChatGPT Optimizer is a Chrome MV3 extension that keeps ChatGPT responsive in long conversations by trimming heavy chat history before render.

### What It Does

- Works only on `https://chatgpt.com/*` and `https://chat.openai.com/*`
- Keeps only the latest messages active to reduce UI lag
- Auto optimize is enabled by default
- Provides quick actions: `Optimize now`, `Load older`, `Hot Reload`
- Supports Turkish and English UI
- If browser language is not Turkish or English, UI defaults to English

### What It Does Not Do

- It does not speed up OpenAI servers
- It does not collect or send personal data
- It does not perform external analytics or telemetry calls

### Privacy

- Fully local operation in browser
- No data collection
- No telemetry

### Installation

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this project folder

## Turkce

ChatGPT Optimizer, ChatGPT web arayuzunde uzun sohbetlerde olusan hantalligi azaltmak icin konusma gecmisini render oncesi optimize eder.

### Ne Yapar

- Sadece `https://chatgpt.com/*` ve `https://chat.openai.com/*` alanlarinda calisir
- Arayuz yavaslamasini azaltmak icin son mesajlari aktif tutar
- Otomatik optimize varsayilan olarak aciktir
- Hizli islemler sunar: `Simdi optimize et`, `Daha eskileri goster`, `Hot Reload`
- Turkce ve Ingilizce arayuzu destekler
- Tarayici dili Turkce veya Ingilizce degilse varsayilan olarak Ingilizce kullanir

### Ne Yapmaz

- OpenAI sunucu gecikmelerini hizlandirmaz
- Kisisel veri toplamaz ve gondermez
- Dis analitik veya telemetri cagrisi yapmaz

### Gizlilik

- Tamamen tarayici icinde, yerel calisir
- Veri toplama yok
- Telemetri yok

### Kurulum

1. Chrome'da `chrome://extensions` sayfasini acin
2. `Developer mode` secenegini acin
3. `Load unpacked` butonuna basin
4. Bu proje klasorunu secin
