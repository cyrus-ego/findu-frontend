# Setup domain chatvn.online cho VPS

Tài liệu này ghi lại các bước cấu hình domain `chatvn.online` trỏ về VPS `161.118.255.117`, nơi frontend chạy ở port `3002` và API chạy ở port `3001`.

Mục tiêu cuối cùng:

```text
https://chatvn.online        -> frontend nội bộ http://127.0.0.1:3002
https://www.chatvn.online    -> frontend nội bộ http://127.0.0.1:3002
https://api.chatvn.online    -> API nội bộ http://127.0.0.1:3001
```

## Nguyên tắc cần nhớ

DNS chỉ trỏ được domain về IP, không trỏ được trực tiếp về port.

Sai về mặt nguyên tắc:

```text
chatvn.online -> 161.118.255.117:3002
```

Đúng:

```text
chatvn.online -> 161.118.255.117
Nginx trên VPS listen port 80/443
Nginx reverse proxy request vào 127.0.0.1:3002 hoặc 127.0.0.1:3001
```

Port bên ngoài mà trình duyệt dùng:

```text
80   HTTP
443  HTTPS
```

Port nội bộ app dùng:

```text
3002 frontend
3001 API
```

Người dùng truy cập `https://chatvn.online`, trình duyệt tự dùng port `443`. Nginx nhận request ở `443`, rồi chuyển tiếp nội bộ tới `http://127.0.0.1:3002`.

## Bước 1: Cấu hình DNS trên Namecheap

Trong Namecheap:

```text
Domain List
-> Manage domain chatvn.online
-> Advanced DNS
-> Host Records
```

Thêm 3 record:

```text
Type: A Record
Host: @
Value: 161.118.255.117
TTL: Automatic

Type: A Record
Host: www
Value: 161.118.255.117
TTL: Automatic

Type: A Record
Host: api
Value: 161.118.255.117
TTL: Automatic
```

Xoá các record mặc định/xung đột của Namecheap, ví dụ:

```text
CNAME Record       www -> parkingpage.namecheap.com.
URL Redirect Record @  -> http://www.chatvn.online/
```

Lý do cần xoá:

- `www` không nên vừa có `CNAME` vừa có `A Record`.
- `@` không nên vừa có `URL Redirect Record` vừa có `A Record`.
- Redirect HTTP sang HTTPS nên làm ở Nginx, không làm bằng URL Redirect của Namecheap.

Kiểm tra DNS:

```bash
dig +short chatvn.online
dig +short www.chatvn.online
dig +short api.chatvn.online
```

Kết quả mong muốn:

```text
161.118.255.117
161.118.255.117
161.118.255.117
```

## Bước 2: Cài Nginx và Certbot

SSH vào VPS:

```bash
ssh hai@oc2.lifebow.net
```

Cài Nginx và Certbot:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Kiểm tra Nginx:

```bash
sudo systemctl status nginx
```

Nếu Nginx chưa chạy:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Bước 3: Cấu hình Nginx reverse proxy

Tạo file:

```bash
sudo nano /etc/nginx/sites-available/chatvn.online
```

Nội dung ban đầu, trước khi cấp SSL:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name chatvn.online www.chatvn.online;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    listen [::]:80;

    server_name api.chatvn.online;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/chatvn.online /etc/nginx/sites-enabled/chatvn.online
```

Nếu báo file đã tồn tại thì bỏ qua.

Kiểm tra syntax và reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Kết quả mong muốn:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Bước 4: Kiểm tra Nginx listen port 80

Trên VPS:

```bash
sudo ss -ltnp | grep ':80'
```

Kết quả mong muốn có dạng:

```text
LISTEN 0 511 0.0.0.0:80 ...
LISTEN 0 511 [::]:80 ...
```

Test local:

```bash
curl -I http://127.0.0.1
curl -I -H "Host: chatvn.online" http://127.0.0.1
curl -I -H "Host: api.chatvn.online" http://127.0.0.1
```

Nếu thấy `200`, `301`, `302`, hoặc `502 Bad Gateway`, nghĩa là Nginx đã nhận request.

Ý nghĩa của `502 Bad Gateway`: Nginx chạy được, nhưng app nội bộ ở port `3001` hoặc `3002` chưa phản hồi đúng.

## Bước 5: Kiểm tra firewall UFW

`ufw` là Uncomplicated Firewall, công cụ quản lý firewall đơn giản trên Ubuntu/Debian.

Kiểm tra:

```bash
sudo ufw status
```

Trường hợp đã gặp:

```text
Status: inactive
```

Nghĩa là UFW chưa bật, nên không phải nguyên nhân chặn port.

Có thể thêm sẵn rule:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
```

Ý nghĩa:

```text
OpenSSH     cho phép SSH, thường là port 22
Nginx Full  cho phép HTTP port 80 và HTTPS port 443
```

Nếu sau này muốn bật UFW:

```bash
sudo ufw enable
sudo ufw status
```

Chỉ bật sau khi đã chắc chắn `OpenSSH` được allow, tránh tự khóa SSH khỏi VPS.

## Bước 6: Kiểm tra từ internet vào port 80

Từ máy local, không phải từ VPS:

```bash
curl -I --connect-timeout 5 http://161.118.255.117
curl -I --connect-timeout 5 http://chatvn.online
```

Cách đọc lỗi:

```text
HTTP response       port 80 mở và Nginx phản hồi
Connection refused  tới được VPS nhưng service không listen hoặc bị reject local
Operation timed out có thể bị cloud firewall/security list chặn
No route to host    có thể bị firewall/network reject
```

Trong lần setup này, từ máy ngoài đã gặp lỗi:

```text
curl: (7) Failed to connect to 161.118.255.117 port 80: Couldn't connect to server
```

Trong khi trên VPS:

```text
Nginx active
Nginx listen 0.0.0.0:80
curl http://127.0.0.1 trả 200
```

Vì vậy cần kiểm tra firewall sâu hơn.

## Bước 7: Dùng tcpdump để biết packet có tới VPS không

Trên VPS, mở một terminal SSH và chạy:

```bash
sudo tcpdump -nni any tcp port 80
```

Từ máy local, chạy:

```bash
curl -I --connect-timeout 5 http://161.118.255.117
```

Cách đọc:

```text
tcpdump không hiện packet  -> request chưa tới VPS, nghi cloud firewall/provider
tcpdump có packet hiện ra  -> request đã tới VPS, nghi firewall trong VPS hoặc routing nội bộ
```

Trong lần setup này, `tcpdump` có packet hiện ra. Vậy request đã tới VPS, không phải chỉ do cloud firewall.

## Bước 8: Kiểm tra iptables

Chạy:

```bash
sudo iptables -L INPUT -n -v --line-numbers
```

Output đã gặp:

```text
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source        destination
1    ...       ACCEPT     all  --  *      *       0.0.0.0/0     0.0.0.0/0     state RELATED,ESTABLISHED
2    ...       ACCEPT     icmp --  *      *       0.0.0.0/0     0.0.0.0/0
3    ...       ACCEPT     all  --  lo     *       0.0.0.0/0     0.0.0.0/0
4    ...       ACCEPT     udp  --  *      *       0.0.0.0/0     0.0.0.0/0     udp spt:123
5    ...       ACCEPT     tcp  --  *      *       0.0.0.0/0     0.0.0.0/0     state NEW tcp dpt:22
6    ...       REJECT     all  --  *      *       0.0.0.0/0     0.0.0.0/0     reject-with icmp-host-prohibited
```

Điểm dễ nhầm:

```text
Chain INPUT (policy ACCEPT)
```

nhưng rule số `6`:

```text
REJECT all -- 0.0.0.0/0 0.0.0.0/0 reject-with icmp-host-prohibited
```

đang reject toàn bộ traffic chưa được allow ở các rule phía trên.

Hiện chỉ có port SSH `22` được allow:

```text
state NEW tcp dpt:22
```

Chưa có port `80` và `443`, nên request web bị rơi xuống rule `REJECT`.

## Bước 9: Mở port 80 và 443 trong iptables

Thêm rule trước dòng `REJECT`.

Vì rule `REJECT` đang ở dòng 6, chạy:

```bash
sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 7 -p tcp -m state --state NEW -m tcp --dport 443 -j ACCEPT
```

Kiểm tra lại:

```bash
sudo iptables -L INPUT -n -v --line-numbers
```

Kết quả mong muốn là rule allow `80` và `443` nằm trước rule `REJECT`.

Sau đó test từ máy local:

```bash
curl -I --connect-timeout 5 http://161.118.255.117
curl -I --connect-timeout 5 http://chatvn.online
curl -I --connect-timeout 5 http://api.chatvn.online
```

Nếu có HTTP response, port 80 đã mở thành công.

## Bước 10: Lưu iptables để reboot không mất

Nếu chỉ chạy `iptables -I`, rule có thể mất sau khi reboot.

Cài package lưu rule:

```bash
sudo apt install -y iptables-persistent
```

Khi được hỏi lưu IPv4 rules, chọn `Yes`.

Sau đó:

```bash
sudo netfilter-persistent save
```

Kiểm tra service:

```bash
sudo systemctl status netfilter-persistent
```

## Bước 11: Cấp SSL HTTPS bằng Certbot

SSL/HTTPS dùng để:

- Biến `http://chatvn.online` thành `https://chatvn.online`.
- Mã hóa dữ liệu giữa trình duyệt và VPS.
- Tránh cảnh báo `Not secure` trên trình duyệt.
- Bảo vệ cookie, token, login, request API, nội dung chat.
- Tránh lỗi mixed content khi frontend HTTPS gọi API HTTP.

Certbot là công cụ xin SSL miễn phí từ Let's Encrypt và tự cấu hình Nginx.

Chạy:

```bash
sudo certbot --nginx -d chatvn.online -d www.chatvn.online -d api.chatvn.online
```

Certbot có thể hỏi:

```text
Email                  nhập email để nhận thông báo SSL
Terms of Service       chọn Y
Share email with EFF   chọn N cũng được
Redirect HTTP->HTTPS   nên chọn redirect
```

Trước khi chạy Certbot cần đảm bảo:

```bash
dig +short chatvn.online
dig +short www.chatvn.online
dig +short api.chatvn.online
sudo nginx -t
curl -I http://chatvn.online
```

Domain phải trỏ đúng IP, Nginx syntax OK, và port 80 phải truy cập được từ internet.

## Bước 12: Vì sao file Nginx ban đầu chỉ listen 80

Trước khi có SSL certificate, Nginx chỉ cần listen port `80`.

Quy trình:

```text
Bước đầu: Nginx listen 80
Certbot dùng port 80 để xác minh domain
Sau khi cấp SSL: Certbot tự thêm listen 443 ssl
```

Sau khi chạy Certbot, Nginx thường được sửa thành dạng:

```nginx
server {
    server_name chatvn.online www.chatvn.online;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/chatvn.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chatvn.online/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
    }
}

server {
    listen 80;
    server_name chatvn.online www.chatvn.online;
    return 301 https://$host$request_uri;
}
```

Tương tự cho `api.chatvn.online`.

## Bước 13: Kiểm tra HTTPS sau khi cấp SSL

Chạy:

```bash
curl -I https://chatvn.online
curl -I https://www.chatvn.online
curl -I https://api.chatvn.online
```

Kiểm tra HTTP có redirect sang HTTPS:

```bash
curl -I http://chatvn.online
curl -I http://api.chatvn.online
```

Kết quả mong muốn có thể là:

```text
HTTP/1.1 301 Moved Permanently
Location: https://chatvn.online/...
```

Kiểm tra tự gia hạn SSL:

```bash
sudo certbot renew --dry-run
```

Nếu pass, Certbot có thể tự renew certificate khi gần hết hạn.

## Checklist debug nhanh

### DNS

```bash
dig +short chatvn.online
dig +short www.chatvn.online
dig +short api.chatvn.online
```

Phải ra:

```text
161.118.255.117
```

### Nginx syntax

```bash
sudo nginx -t
```

### Nginx service

```bash
sudo systemctl status nginx
```

### Nginx listen port

```bash
sudo ss -ltnp | grep ':80'
sudo ss -ltnp | grep ':443'
```

Port `443` chỉ xuất hiện sau khi đã cấp SSL hoặc tự cấu hình SSL.

### Test local trong VPS

```bash
curl -I http://127.0.0.1
curl -I -H "Host: chatvn.online" http://127.0.0.1
curl -I -H "Host: api.chatvn.online" http://127.0.0.1
```

### Test từ internet

Chạy từ máy local:

```bash
curl -I --connect-timeout 5 http://161.118.255.117
curl -I --connect-timeout 5 http://chatvn.online
curl -I --connect-timeout 5 http://api.chatvn.online
```

### UFW

```bash
sudo ufw status verbose
```

### iptables

```bash
sudo iptables -L INPUT -n -v --line-numbers
sudo iptables-save
```

### nftables

```bash
sudo nft list ruleset
```

### tcpdump

Trên VPS:

```bash
sudo tcpdump -nni any tcp port 80
```

Từ máy ngoài:

```bash
curl -I --connect-timeout 5 http://161.118.255.117
```

Nếu `tcpdump` có packet, request đã tới VPS.

Nếu `tcpdump` không có packet, kiểm tra cloud firewall/security list/network security group của nhà cung cấp VPS.

## Lệnh tóm tắt quan trọng

Mở port 80/443 trong iptables khi có rule REJECT cuối chain:

```bash
sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 7 -p tcp -m state --state NEW -m tcp --dport 443 -j ACCEPT
```

Lưu iptables:

```bash
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

Cấp SSL:

```bash
sudo certbot --nginx -d chatvn.online -d www.chatvn.online -d api.chatvn.online
```

Kiểm tra renew SSL:

```bash
sudo certbot renew --dry-run
```

## Ghi nhớ cuối cùng

Luồng request sau khi setup đúng:

```text
User browser
-> DNS chatvn.online = 161.118.255.117
-> VPS port 443
-> Nginx
-> proxy_pass http://127.0.0.1:3002
-> frontend app
```

API:

```text
User/browser/frontend
-> DNS api.chatvn.online = 161.118.255.117
-> VPS port 443
-> Nginx
-> proxy_pass http://127.0.0.1:3001
-> API app
```

Nếu sau này đổi app port, chỉ cần sửa `proxy_pass` trong Nginx, không cần đổi DNS.
