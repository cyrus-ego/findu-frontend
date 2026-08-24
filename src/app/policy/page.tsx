import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư | Talk First',
  description: 'Chính sách quyền riêng tư của ứng dụng Talk First.',
};

const sections = [
  {
    title: '1. Dữ liệu chúng tôi thu thập',
    content: (
      <>
        <p>Để cung cấp dịch vụ, Talk First có thể thu thập:</p>
        <ul>
          <li>
            Thông tin tài khoản như email, tên hiển thị, phương thức đăng nhập và thông tin cơ bản
            do Google hoặc Facebook cung cấp khi bạn chọn đăng nhập qua các dịch vụ này.
          </li>
          <li>
            Thông tin hồ sơ do bạn cung cấp như giới tính, độ tuổi, giới thiệu, tùy chọn ghép đôi và
            ảnh đại diện.
          </li>
          <li>
            Nội dung bạn gửi trong ứng dụng như tin nhắn, hình ảnh, báo cáo vi phạm và danh sách
            người dùng bị chặn.
          </li>
          <li>
            Dữ liệu kỹ thuật cần thiết để vận hành và bảo mật dịch vụ, gồm mã thiết bị nhận thông
            báo, địa chỉ IP, loại thiết bị và nhật ký lỗi.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '2. Cách chúng tôi sử dụng dữ liệu',
    content: (
      <p>
        Dữ liệu được dùng để tạo và xác thực tài khoản, ghép đôi người dùng, cung cấp tính năng trò
        chuyện và thông báo, cá nhân hóa hồ sơ, kiểm duyệt nội dung, xử lý báo cáo, hỗ trợ người
        dùng, phòng chống gian lận và duy trì an toàn cho dịch vụ.
      </p>
    ),
  },
  {
    title: '3. Chia sẻ dữ liệu',
    content: (
      <p>
        Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ ở mức cần thiết với nhà cung
        cấp hạ tầng và các dịch vụ hỗ trợ vận hành như Google Sign-In, Facebook Login và Firebase
        Cloud Messaging; khi có yêu cầu hợp pháp; hoặc để bảo vệ người dùng và dịch vụ. Người được
        ghép đôi chỉ thấy thông tin hồ sơ và nội dung mà bạn chủ động chia sẻ trong cuộc trò chuyện.
      </p>
    ),
  },
  {
    title: '4. Bảo mật dữ liệu',
    content: (
      <p>
        Chúng tôi sử dụng kết nối HTTPS, lưu mật khẩu dưới dạng đã băm và giới hạn quyền truy cập dữ
        liệu. Không có biện pháp truyền tải hoặc lưu trữ nào an toàn tuyệt đối, nhưng chúng tôi áp
        dụng các biện pháp hợp lý để ngăn truy cập, thay đổi hoặc tiết lộ trái phép.
      </p>
    ),
  },
  {
    title: '5. Lưu giữ dữ liệu',
    content: (
      <p>
        Thông tin tài khoản và hồ sơ được lưu trong thời gian tài khoản còn hoạt động. Tin nhắn
        trong phòng chat được lưu tạm thời để duy trì cuộc trò chuyện và bị xóa khi phòng chat đóng.
        Bản ghi yêu cầu xóa và dữ liệu an toàn/chống lạm dụng tối thiểu có thể được giữ tối đa 90
        ngày sau khi hoàn tất yêu cầu, sau đó bị xóa, trừ khi pháp luật yêu cầu thời hạn dài hơn.
      </p>
    ),
  },
  {
    title: '6. Quyền của bạn',
    content: (
      <p>
        Bạn có thể xem và cập nhật thông tin hồ sơ trong ứng dụng. Bạn cũng có thể yêu cầu truy cập,
        chỉnh sửa hoặc xóa dữ liệu cá nhân bằng cách liên hệ với chúng tôi. Chúng tôi có thể cần xác
        minh quyền sở hữu tài khoản trước khi xử lý yêu cầu.
      </p>
    ),
  },
  {
    title: '7. Trẻ em',
    content: (
      <p>
        Talk First không dành cho trẻ em dưới 13 tuổi. Chúng tôi không chủ ý thu thập dữ liệu cá
        nhân của trẻ em dưới độ tuổi này. Nếu phát hiện trường hợp như vậy, chúng tôi sẽ xóa dữ liệu
        liên quan.
      </p>
    ),
  },
  {
    title: '8. Thay đổi chính sách',
    content: (
      <p>
        Chính sách này có thể được cập nhật khi dịch vụ hoặc yêu cầu pháp lý thay đổi. Phiên bản mới
        sẽ được đăng tại trang này và ghi rõ ngày cập nhật.
      </p>
    ),
  },
];

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Về trang chủ
        </Link>

        <header className="mb-8 border-b pb-8">
          <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Chính sách quyền riêng tư
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Ứng dụng Talk First</p>
          <p className="mt-1 text-sm text-muted-foreground">Cập nhật lần cuối: 24/08/2026</p>
        </header>

        <p className="mb-8 leading-7 text-muted-foreground">
          Talk First tôn trọng quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu
          thập, sử dụng, chia sẻ và bảo vệ dữ liệu khi bạn sử dụng ứng dụng Talk First và website
          chatvn.online.
        </p>

        <section
          id="account-deletion"
          className="mb-10 scroll-mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold">Yêu cầu xóa tài khoản và dữ liệu</h2>
              <p className="mt-2 leading-7 text-muted-foreground">
                Người dùng Talk First có thể gửi yêu cầu trực tiếp trên website mà không cần cài đặt
                lại ứng dụng.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground">
                <li>Chọn nút “Đến trang xóa tài khoản” bên dưới.</li>
                <li>Đăng nhập đúng tài khoản cần xóa nếu được yêu cầu.</li>
                <li>
                  Tại mục “Xóa tài khoản Talk First”, chọn “Gửi yêu cầu xóa tài khoản” và xác nhận.
                </li>
              </ol>
              <Link
                href="/profile?deleteAccount=1"
                className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Đến trang xóa tài khoản
              </Link>
              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-lg border bg-background/60 p-4">
                  <h3 className="font-semibold text-foreground">Dữ liệu sẽ bị xóa</h3>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    Tài khoản, email và dữ liệu xác thực; hồ sơ và ảnh đại diện; tùy chọn ghép đôi;
                    token thông báo; danh sách chặn và dữ liệu trò chuyện còn lại.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <h3 className="font-semibold text-foreground">Dữ liệu được giữ tạm thời</h3>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    Bản ghi yêu cầu và dữ liệu an toàn/chống lạm dụng tối thiểu được giữ tối đa 90
                    ngày sau khi hoàn tất, sau đó bị xóa, trừ khi pháp luật yêu cầu lâu hơn.
                  </p>
                </div>
              </div>
              <p className="mt-4 leading-7 text-muted-foreground">
                Talk First sẽ hoàn tất yêu cầu trong tối đa 30 ngày. Nếu không thể đăng nhập, hãy
                gửi email từ địa chỉ đã đăng ký đến{' '}
                <a
                  href="mailto:cyr.admin.sys@gmail.com?subject=Y%C3%AAu%20c%E1%BA%A7u%20x%C3%B3a%20t%C3%A0i%20kho%E1%BA%A3n%20Talk%20First"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  cyr.admin.sys@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-7 text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold tracking-tight">Liên hệ về quyền riêng tư</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Nhà phát triển và đơn vị vận hành: Talk First
          </p>
          <a
            href="mailto:cyr.admin.sys@gmail.com"
            className="mt-3 inline-flex items-center gap-2 font-medium text-primary underline underline-offset-4"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            cyr.admin.sys@gmail.com
          </a>
        </section>
      </article>
    </main>
  );
}
