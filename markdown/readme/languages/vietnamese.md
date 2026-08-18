<h1 align="center" style="border-bottom: none">
    <div>
        <a style="color:#36f" href="https://www.atmosphere.dev">
            Atmosphere
        </a>
    </div>
</h1>

<p align="center">
Atmosphere là cách nhanh nhất và dễ dàng nhất để xây dựng một cơ sở dữ liệu online.
</p>


<p align="center">
    <a href="http://www.atmosphere.dev"><b>Website</b></a> •
    <a href="https://discord.gg/c7GEYrvFtT"><b>Discord</b></a> •
    <a href="https://community.atmosphere.dev/"><b>Community</b></a> •
    <a href="https://twitter.com/atmosphere"><b>Twitter</b></a> •
    <a href="https://www.reddit.com/r/Atmosphere/"><b>Reddit</b></a> •
    <a href="https://docs.atmosphere.dev/"><b>Documentation</b></a>
</p>

![video avi](https://github.com/GaryOcean428/atmosphere/assets/86527202/e2fad786-f211-4dcb-9bd3-aaece83a6783)

# Tham gia cộng đồng của chúng tôi

<a href="https://discord.gg/c7GEYrvFtT" target="_blank">
<img src="https://discordapp.com/api/guilds/661905455894888490/widget.png?style=banner3" alt="">
</a>

[![Stargazers repo roster for @atmosphere/atmosphere](http://reporoster.com/stars/atmosphere/atmosphere)](https://github.com/GaryOcean428/atmosphere/stargazers)

# Cài đặt

## Docker với SQLite

```bash 
docker run -d \
  --name atmosphere \
  -v "$(pwd)"/atmosphere:/usr/app/data/ \
  -p 8080:8080 \
  atmosphere/atmosphere:latest
  ```

## Docker với PostgreSQL
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
Auto-upstall là một câu lệnh duy nhất để triển khai Atmosphere trên môi trường production.
Câu lệnh này sẽ tạo ra file docker compose cho bạn.

```bash
bash <(curl -sSL http://install.atmosphere.dev/atmosphere.sh) <(mktemp)
```

Auto-upstall thực hiện các việc sau : 🕊
- 🐳 Tự động cài đặt các phần mềm cần thiết như docker, docker-compose.
- 🚀 Tự động cài đặt Atmosphere với PostgreSQL, Redis, Traefik gateway sử dụng Docker Compose. 🐘 🗄️ 🌐
- 🔄 Tự động cập nhật Atmosphere đến phiên bản mới nhất khi bạn chạy lại lệnh.
- 🔒 Tự động cài đặt SSL và làm mới. Việc này cần có domain hoặc subdomain khi cài đặt.
> File cài đặt install.atmosphere.dev/atmosphere.sh có thể được tìm thấy ở [github](https://raw.githubusercontent.com/atmosphere/atmosphere/develop/docker-compose/1_Auto_Upstall/atmosphere.sh)


## Các phương thức cài đặt khác

> Binarie files chỉ sử dụng cho mục đích testing ở máy local.

Phương pháp cài đặt               |Câu lệnh cài đặt                                                                                                                                                                                                                                                                                                                                                         |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 🍏 MacOS arm64 <br>(Binary)   | `curl http://get.atmosphere.dev/macos-arm64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                       |
| 🍏 MacOS x64 <br>(Binary)     | `curl http://get.atmosphere.dev/macos-x64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                         |
| 🐧 Linux arm64 <br>(Binary)   | `curl http://get.atmosphere.dev/linux-arm64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                       |
| 🐧 Linux x64 <br>(Binary)     | `curl http://get.atmosphere.dev/linux-x64 -o atmosphere -L && chmod +x atmosphere && ./atmosphere`                                                                                                                                                                                                                                                                                         |
| 🪟 Windows arm64 <br>(Binary) | `iwr http://get.atmosphere.dev/win-arm64.exe -OutFile Atmosphere-win-arm64.exe && .\Atmosphere-win-arm64.exe`                                                                                                                                                                                                                                                                                    |
| 🪟 Windows x64 <br>(Binary)   | `iwr http://get.atmosphere.dev/win-x64.exe -OutFile Atmosphere-win-x64.exe && .\Atmosphere-win-x64.exe`                                                                                                                                                                                                                                                                                          |


> Khi chạy ở local, truy cập atmosphere qua địa chỉ: [http://localhost:8080/dashboard](http://localhost:8080/dashboard)

Với các phương pháp cài đặt khác, tham khảo [tài liệu của chúng tôi](https://docs.atmosphere.dev/category/installation)

# Ảnh chụp màn hình
![2](https://github.com/GaryOcean428/atmosphere/assets/86527202/a127c05e-2121-4af2-a342-128e0e2d0291)
![3](https://github.com/GaryOcean428/atmosphere/assets/86527202/674da952-8a06-4848-a0e8-a7b02d5f5c88)
![4](https://github.com/GaryOcean428/atmosphere/assets/86527202/cbc5152a-9caf-4f77-a8f7-92a9d06d025b)
![5](https://github.com/GaryOcean428/atmosphere/assets/86527202/dc75dfdc-c486-4f5a-a853-2a8f9e6b569a)

![5](https://user-images.githubusercontent.com/35857179/194844886-a17006e0-979d-493f-83c4-0e72f5a9b716.png)
![7](https://github.com/GaryOcean428/atmosphere/assets/86527202/be64e619-7295-43e2-aa95-cace4462b17f)
![8](https://github.com/GaryOcean428/atmosphere/assets/86527202/4538bf5a-371f-4ec1-a867-8197e5824286)

![8](https://user-images.githubusercontent.com/35857179/194844893-82d5e21b-ae61-41bd-9990-31ad659bf490.png)
![9](https://user-images.githubusercontent.com/35857179/194844897-cfd79946-e413-4c97-b16d-eb4d7678bb79.png)
![10](https://user-images.githubusercontent.com/35857179/194844902-c0122570-0dd5-41cf-a26f-6f8d71fefc99.png)
![11](https://user-images.githubusercontent.com/35857179/194844903-c1e47f40-e782-4f5d-8dce-6449cc70b181.png)
![12](https://user-images.githubusercontent.com/35857179/194844907-09277d3e-cbbf-465c-9165-6afc4161e279.png)

# Các tính năng

### Cung cấp giao diện bảng tính

- ⚡ &nbsp;Basic Operations: Create, Read, Update and Delete Tables, Columns, and Rows
- ⚡ &nbsp;Fields Operations: Sort, Filter, Group, Hide / Unhide Columns
- ⚡ &nbsp;Multiple Views Types: Grid (By default), Gallery, Form, Kanban and Calendar View
- ⚡ &nbsp;View Permissions Types: Collaborative Views, & Locked Views
- ⚡ &nbsp;Share Bases / Views: either Public or Private (with Password Protected)
- ⚡ &nbsp;Variant Cell Types: ID, Links, Lookup, Rollup, SingleLineText, Attachment, Currency, Formula, User, etc
- ⚡ &nbsp;Access Control with Roles: Fine-grained Access Control at different levels
- ⚡ &nbsp;and more ...

### Cửa hàng ứng dụng với tự động hoá tác vụ

Chúng tôi cung cấp khả năng tích hợp với 3 loại ứng dụng. Xem <a href="https://docs.atmosphere.dev/account-settings/oss-specific-details/#app-store" target="_blank">App Store</a> để biết thêm chi tiết.

- ⚡ &nbsp;Chat: Slack, Discord, Mattermost...
- ⚡ &nbsp;Email: AWS SES, SMTP, MailerSend...
- ⚡ &nbsp;Storage: AWS S3, Google Cloud Storage, Minio...

### Programmatic Access

Chúng tôi cung cấp các cách thức để người dùng có thể lập trình các tác vụ. Bạn có thể dùng token (JWT hoặc Social Auth) để xác thực với Atmosphere.

- ⚡ &nbsp;REST APIs
- ⚡ &nbsp;Atmosphere SDK

# Đóng góp

Tham khảo [Contribution Guide](https://github.com/GaryOcean428/atmosphere/blob/master/.github/CONTRIBUTING.md).

# Tại sao chúng tôi xây dựng ứng dụng này?

Hầu hết các doanh nghiệp sử dụng internet đều trang bị công cụ bảng tính hoặc cơ sở dũ liệu để phục vụ nhu cầu của họ.
Bảng tính là công cụ được hàng tỉ người sử dụng mỗi ngày.
Tuy nhiên, chúng tôi xây dựng một công cụ bảng tính hoạt động trên cơ sở dữ liệu kết hợp với các công cụ tính toán mạnh.
Những nỗ lực giải quyết vấn đề này bằng các dịch vụ SaaS đã tạo ra các biện pháp kiểm soát truy cập tồi tệ, phụ thuộc vào nhà cung cấp, khóa chặt dữ liệu, thay đổi giá đột ngột và quan trọng nhất là tạo ra rào cản vô hình đối với những khả năng có thể xảy ra trong tương lai.

# Sứ mệnh của chúng tôi

Sứ mệnh của chúng tôi là cung cấp công cụ no-code mạnh mẽ nhất cho cơ sở dữ liệu, mã nguồn mở cho mọi doanh nghiệp internet trên thế giới.
Điều này không chỉ dân chủ hóa quyền truy cập vào một công cụ điện toán mạnh mẽ mà còn tạo ra hơn một tỷ người có khả năng mày mò và xây dựng triệt để trên internet.

# Giấy phép

<p>
Dự án này sử dụng giấy phép <a href="./LICENSE">AGPLv3</a>.
</p>

# Contributors

Cảm ơn những người đóng góp! Chúng tôi luôn chân trọng mọi đóng góp từ cộng đồng.

<a href="https://github.com/GaryOcean428/atmosphere/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=atmosphere/atmosphere" />
</a>
