<h1 align="center" style="border-bottom: none">
    <div>
        <a style="color:#36f" href="https://www.atmosphere.dev">
            <img src="/packages/atmosphere-gui/assets/img/brand/atmosphere-full.png" height="80" />
            <br>
    Açık Kaynak Kodlu Airtable Alternatifi 
        </a>
        <br>
    </div>
</h1>

<p align="center">
Atmosphere online veritabanı oluşturmanın en hızlı ve kolay yoludur.
</p>


<p align="center">
    <a href="http://www.atmosphere.dev"><b>Web sitesi</b></a> •
    <a href="https://discord.gg/c7GEYrvFtT"><b>Discord</b></a> •
    <a href="https://community.atmosphere.dev/"><b>Topluluk</b></a> •
    <a href="https://twitter.com/atmosphere"><b>Twitter</b></a> •
    <a href="https://www.reddit.com/r/Atmosphere/"><b>Reddit</b></a> •
    <a href="https://docs.atmosphere.dev/"><b>Dokümantasyon</b></a>
</p>

![video avi](https://github.com/GaryOcean428/atmosphere/assets/86527202/e2fad786-f211-4dcb-9bd3-aaece83a6783)

# Topluluğumuza Katılın

<a href="https://discord.gg/c7GEYrvFtT" target="_blank">
<img src="https://discordapp.com/api/guilds/661905455894888490/widget.png?style=banner3" alt="">
</a>

[![Stargazers repo roster for @atmosphere/atmosphere](http://reporoster.com/stars/atmosphere/atmosphere)](https://github.com/GaryOcean428/atmosphere/stargazers)

# Kurulum

## Docker ile SQLite

```bash 
docker run -d \
  --name atmosphere \
  -v "$(pwd)"/atmosphere:/usr/app/data/ \
  -p 8080:8080 \
  atmosphere/atmosphere:latest
  ```

## Docker ile PG
```bash
docker run -d \
  --name atmosphere \
  -v "$(pwd)"/atmosphere:/usr/app/data/ \
  -p 8080:8080 \
  -e ATMOSPHERE_DB="pg://host.docker.internal:5432?u=root&p=password&d=d1" \
  -e ATMOSPHERE_AUTH_JWT_SECRET="569a1821-0a93-45e8-87ab-eb857f20a010" \
  atmosphere/atmosphere:latest
```

## Auto-upstall
Auto-upstall, Atmosphere'yi production (canlı) ortamı için hazırlayan bir komuttur. Arka planda docker-compose dosyasını sizin için otomatik olarak oluşturur.

```bash
bash <(curl -sSL http://install.atmosphere.dev/atmosphere.sh) <(mktemp)
```

Auto-upstall şunları yapar: 🕊
- 🐳 Docker ve Docker Compose gibi tüm ön gereksinimleri otomatik olarak yükler.
- 🚀 Docker Compose kullanarak Atmosphere ile birlikte PostgreSQL, Redis ve Traefik gateway servislerini otomatik olarak kurar. 🐘 🗄️ 🌐
- 🔄 Komutu tekrar çalıştırdığınızda Atmosphere'yi otomatik olarak en son sürüme günceller.
- 🔒 SSL sertifikasını otomatik olarak kurar ve yeniler. Kurulum sırasında bir alan adı (domain) veya alt alan adı (subdomain) girmeniz gerekir.
>  [install.atmosphere.dev/atmosphere.sh](https://raw.githubusercontent.com/atmosphere/atmosphere/develop/docker-compose/1_Auto_Upstall/atmosphere.sh) script'ini GitHub sayfamızda bulabilirsiniz. 


## Diğer Yöntemler

> Binary dosyaları sadece yerel ortamda hızlı test amaçlıdır.

| Kurulum Yöntemi               | Kurulum Komudu                                                                                                                                                                                                                                                                                                                                                        |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 🍏 MacOS arm64 <br>(Binary)   | `curl http://get.atmosphere.dev/macos-arm64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                       |
| 🍏 MacOS x64 <br>(Binary)     | `curl http://get.atmosphere.dev/macos-x64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                         |
| 🐧 Linux arm64 <br>(Binary)   | `curl http://get.atmosphere.dev/linux-arm64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                       |
| 🐧 Linux x64 <br>(Binary)     | `curl http://get.atmosphere.dev/linux-x64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                         |
| 🪟 Windows arm64 <br>(Binary) | `iwr http://get.atmosphere.dev/win-arm64.exe -OutFile Atmosphere-win-arm64.exe && .\Atmosphere-win-arm64.exe`                                                                                                                                                                                                                                                                              |
| 🪟 Windows x64 <br>(Binary)   | `iwr http://get.atmosphere.dev/win-x64.exe -OutFile Atmosphere-win-x64.exe && .\Atmosphere-win-x64.exe`                                                                                                                                                                                                                                                                                    |


> Lokalde çalışırken Atmosphere'ye [http://localhost:8080/dashboard](http://localhost:8080/dashboard) adresinden erişebilirsiniz. 

Diğer kurulum yöntemleri için [dokümanlarımızı](https://docs.atmosphere.dev/category/installation) inceleyebilirsiniz.

# Ekran Görüntüleri
![2](https://github.com/user-attachments/assets/ffcabc8a-9b3b-48f1-9d04-16859878540e)
![3](https://github.com/user-attachments/assets/13a58c7a-2305-4289-af19-3382c1b759f5)
![4](https://github.com/user-attachments/assets/c2e5415e-389e-49a4-b6d4-289d6b3bf4fc)
![5](https://github.com/user-attachments/assets/c15b72c5-6108-4c3b-b29a-2c295f722d45)

![5](https://github.com/user-attachments/assets/7a5469db-a65a-4414-8e28-e8e640131163)
![7](https://github.com/user-attachments/assets/4ea1398e-bfea-44f4-bfb7-02ae6b936b89)
![8](https://github.com/user-attachments/assets/730bd343-a296-43f5-8c4c-35ffe8a88852)

![8](https://github.com/user-attachments/assets/7bd64315-45e6-4953-9c20-5bfc45955293)
![9](https://github.com/user-attachments/assets/a92edcc6-2412-4eaa-b99a-e01c0b16f6af)
![10](https://github.com/user-attachments/assets/9d5dbebc-4288-4057-9fcd-cf4289dcc22e)
![11](https://github.com/user-attachments/assets/e7ab0a5d-8869-4874-8d65-bdb5bf114fd1)
![12](https://github.com/user-attachments/assets/1a5b5674-51b4-48fc-af48-1c7bac4b484a)

# Özellikler

### Zengin E-Tablo Arayüzü

- ⚡ &nbsp;Temel İşlemler: Tablo, Sütun ve Satır Oluşturma, Okuma, Güncelleme ve Silme
- ⚡ &nbsp;Veri İşlemleri: Sıralama, Filtreleme, Gruplama, Sütun Gizleme / Gösterme
- ⚡ &nbsp;Çoklu Görünüm Türleri: Izgara (Varsayılan), Galeri, Form, Kanban ve Takvim Görünümü
- ⚡ &nbsp;Görünüm İzin Türleri: Ortak Çalışma Görünümleri ve Kilitli Görünümler
- ⚡ &nbsp;Paylaşım Seçenekleri: Herkese Açık ya da Özel (Parola Korumalı)
- ⚡ &nbsp;Zengin Veri Türleri: ID, Bağlantı, Lookup, Rollup, Tek Satırlı Metin, Dosya Eki, Para Birimi, Formül, Kullanıcı vb.
- ⚡ &nbsp;Rol Tabanlı Erişim Kontrolü: Farklı seviyelerde detaylı erişim denetimi
- ⚡ &nbsp;ve daha fazlası ...

### İş Akışı Otomasyonları için Uygulama Mağazası

Üç ana kategoride çeşitli entegrasyonlar sunuyoruz. Detaylar için <a href="https://docs.atmosphere.dev/account-settings/oss-specific-details/#app-store" target="_blank">Uygulama Mağazası</a>'na göz atabilirsiniz.

- ⚡ &nbsp;Sohbet: Slack, Discord, Mattermost, and etc
- ⚡ &nbsp;E-posta: AWS SES, SMTP, MailerSend, and etc
- ⚡ &nbsp;Depolama: AWS S3, Google Cloud Storage, Minio, and etc

### Programatik Erişim

Kullanıcıların işlemleri programatik olarak tetikleyebilmesi için aşağıdaki yöntemleri sunuyoruz. İsteklerinizi Atmosphere’ye yetkilendirmek için bir token (JWT veya Sosyal Kimlik Doğrulama / Social Auth) kullanabilirsiniz.

- ⚡ &nbsp;REST API'ler
- ⚡ &nbsp;Atmosphere SDK

# Katkıda Bulunma

[Katkı Rehberi](https://github.com/GaryOcean428/atmosphere/blob/master/.github/CONTRIBUTING.md)'ni inceleyebilirsiniz..

# Neden bunu geliştiriyoruz?

Çoğu internet girişimi, ihtiyaçlarını çözmek için ya E-Tablolarını (spreadsheet) ya da veritabanlarını kullanıyor. Bu noktada E-Tabloları her gün bir milyardan fazla insan tarafından kullanılıyor. Ancak işlem gücü bakımından çok daha üstün olan veritabanlarında, maalesef aynı hız ve kolaylıkla çalışılamıyor.
 
Bu sorunu SaaS çözümleriyle aşma girişimleri; yetersiz erişim kontrolleri, sağlayıcıya bağımlılık, verilerin hapsedilmesi ve ani fiyat artışları gibi sorunlar yaratmakla kalmayıp, gelecekte yapılabileceklerin önüne çekilen 'görünmez bir duvar' olmaktan öteye gidemedi.

# Misyonumuz

Misyonumuz, dünyadaki her bir internet girişimine, veritabanları için en güçlü açık kaynaklı no-code arayüzünü sunmaktır. 

Bu sayede sadece güçlü bir teknolojik araca erişimi demokratikleştirmekle kalmayıp, aynı zamanda internet üzerinde radikal üretim ve geliştirme yeteneklerine sahip milyarlarca insanın da önünü açıyoruz.

# Lisans

<p>
Bu proje <a href="./LICENSE">AGPLv3</a> ile lisanslanmıştır.
</p>

# Katkıda Bulunanlar

Katkılarınız için teşekkür ederiz! Topluluktan gelen tüm katkılar bizim için çok değerli.

<a href="https://github.com/GaryOcean428/atmosphere/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=atmosphere/atmosphere" />
</a>
