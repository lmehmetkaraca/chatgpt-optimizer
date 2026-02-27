# ChatGPT Optimizer

![ChatGPT Optimizer Logo](./optimize.png)

ChatGPT Optimizer, ChatGPT web arayüzünde uzun sohbetlerde oluşan hantallığı azaltmak için konuşma yanıtını render öncesi optimize eder.

Geliştirici: lmehmetkaraca.

## Ne yapar

- `https://chatgpt.com/*` ve `https://chat.openai.com/*` üzerinde çalışır.
- Varsayılan olarak otomatik optimizasyon açıktır.
- Sohbet verisini sayfa çizilmeden önce kırpar.
- Kısa sohbetlerde hızlı devreye girer, uzun sohbetlerde etkiyi korur.
- Popup üzerinden limit, anında optimize etme, daha eskileri gösterme ve hot reload kontrolü sağlar.
- TR/EN arayüzünü otomatik seçer.

## Ne yapmaz

- Sunucu tarafı gecikmeleri çözmez.
- ChatGPT dışı sekmelerde optimizasyon çalıştırmaz.

## Gizlilik

- Veri toplamaz.
- Dış ağa istek göndermez.
- Tamamen istemci tarafında çalışır.

## Kurulum

1. Chrome'da `chrome://extensions` açın.
2. `Developer mode` açın.
3. `Load unpacked` ile bu klasörü seçin.

## English Documentation

- [English README](./readme/README_EN.md)
