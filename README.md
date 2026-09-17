# IELTS Lab — Website luyện thi IELTS 4 kỹ năng

Website luyện thi IELTS đầy đủ 4 kỹ năng, giao diện tiếng Việt, chấm điểm bằng AI.
Toàn bộ dịch vụ dùng trong dự án đều có **gói miễn phí, không cần thẻ tín dụng**.

- **Listening** — 4 section đúng format thi thật, chấm tự động ra band score, xem transcript sau khi nộp
- **Reading** — 3 bài đọc học thuật, 9 dạng câu hỏi IELTS, bôi vàng trực tiếp trên bài, giải thích từng câu
- **Writing** — Task 1 (có biểu đồ thật) + Task 2, AI chấm theo đúng 4 band descriptors, sửa lỗi từng câu, bài mẫu band 8
- **Speaking** — ghi âm trong trình duyệt cả 3 part, chuyển giọng nói thành văn bản, AI nhận xét fluency / từ vựng / ngữ pháp
- **Trang chủ** — tiếp tục bài đang làm, band trung bình và từng kỹ năng, gợi ý bài tiếp theo từ AI
- **Đề IELTS** — 10 đề full, mỗi đề gồm Listening, Reading, Writing, Speaking, đồng hồ từng phần và band tổng
- **Dashboard** — biểu đồ tiến bộ theo thời gian, chuỗi ngày học, lịch sử làm bài

Công nghệ: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Firebase Auth + Firestore · Gemini API · Groq Whisper.

---

## 1. Chạy thử trong 2 phút

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — website chạy được **ngay mà không cần cấu hình gì**:

- Chưa có Firebase → tiến độ lưu tạm trong trình duyệt
- Chưa có file MP3 → bài nghe được đọc bằng giọng của trình duyệt
- Chưa có Gemini → phần Writing/Speaking trả về ước lượng sơ bộ và nói rõ đó không phải điểm AI

Ba mục dưới đây sẽ bật đầy đủ tính năng.

---

## 2. Cấu hình Firebase (đăng nhập + lưu tiến độ)

**Bước 1 — tạo project**

1. Vào https://console.firebase.google.com → **Add project**
2. Đặt tên bất kỳ, có thể tắt Google Analytics

**Bước 2 — bật đăng nhập**

1. Menu trái → **Build → Authentication → Get started**
2. Tab **Sign-in method** → bật **Email/Password**
3. Bật tiếp **Google** (chọn email hỗ trợ rồi Save)

**Bước 3 — tạo database**

1. Menu trái → **Build → Firestore Database → Create database**
2. Chọn location gần Việt Nam nhất (`asia-southeast1` — Singapore)
3. Chọn **Start in production mode**
4. Vào tab **Rules**, xoá hết nội dung cũ, dán toàn bộ file `firestore.rules` trong dự án này vào, bấm **Publish**

> Quy tắc trong `firestore.rules` đảm bảo mỗi người chỉ đọc và ghi được dữ liệu của chính mình.
> Đừng để database ở chế độ test mode — ai cũng đọc được dữ liệu của người khác.

**Bước 4 — lấy khoá**

1. Bấm bánh răng ⚙ → **Project settings**
2. Kéo xuống mục **Your apps** → bấm biểu tượng web `</>`
3. Đặt nickname bất kỳ, **không** cần tick Firebase Hosting → Register app
4. Copy các giá trị trong `firebaseConfig`

**Bước 5 — điền vào dự án**

```bash
cp .env.local.example .env.local
```

Mở `.env.local` và điền:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ten-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ten-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ten-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
```

Khởi động lại `npm run dev`.

**Bước 6 — Firestore index (tuỳ chọn)**

Trang Dashboard hiện đọc lịch sử theo người dùng rồi sắp xếp phía trình duyệt, nên
web chạy được ngay cả khi bạn chưa tạo composite index.

Nếu sau này bạn muốn tối ưu truy vấn lịch sử bằng `orderBy("createdAt", "desc")`
trực tiếp trên Firestore, dự án đã có sẵn định nghĩa trong `firestore.indexes.json`.
Dùng Firebase CLI để deploy index:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:indexes
```

**Hạn mức miễn phí (gói Spark):** 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày.
Với cách lưu của dự án này (1 lượt ghi cho mỗi bài làm), bạn phải có khoảng
**vài nghìn người dùng hoạt động mỗi ngày** mới chạm trần.

---

## 3. Bật AI chấm bài (Gemini — miễn phí)

1. Vào https://aistudio.google.com/apikey → **Create API key** (đăng nhập Google là xong, không cần thẻ)
2. Thêm vào `.env.local`:

```
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-flash-latest
```

Sau khi có khoá này:

- Writing được chấm theo Task Achievement / Coherence & Cohesion / Lexical Resource / Grammatical Range, kèm sửa lỗi và bài mẫu band 8
- Speaking được chấm theo Fluency / Lexical / Grammar / Pronunciation
- Trang chủ có API `/api/analyze-progress` để phân tích các bài gần đây và gợi ý kỹ năng / đề nên làm tiếp. Nếu Gemini hết quota, hệ thống tự chuyển sang gợi ý theo điểm thấp nhất.

**Lưu ý về free tier:** Google có giới hạn số lượt mỗi phút và mỗi ngày, và **dùng
prompt của bạn để cải thiện model** ở gói miễn phí (ngoài khu vực EU/UK). Nếu bạn
định thu tiền người dùng, hãy chuyển sang gói trả phí để tắt việc này.

---

## 4. Bật chuyển giọng nói thành văn bản (Groq — miễn phí)

Dùng cho phần Speaking.

1. Vào https://console.groq.com/keys → **Create API Key** (không cần thẻ)
2. Thêm vào `.env.local`:

```
GROQ_API_KEY=gsk_...
```

Hạn mức free: khoảng 30 request/phút, 1.000 request/ngày. Groq **không** dùng dữ
liệu của bạn để train.

Nếu không cấu hình, phần Speaking vẫn ghi âm được — bạn chỉ cần tự gõ lại nội dung
mình vừa nói vào ô transcript trước khi bấm chấm.

---

## 5. Tạo audio thật cho phần Listening

Mặc định bài nghe được đọc bằng giọng có sẵn của trình duyệt. Để có audio giọng bản
xứ (Anh / Úc / Mỹ / Canada) như đề thi thật:

```bash
pip install edge-tts
brew install ffmpeg        # macOS — để chèn khoảng lặng giữa các lượt nói
npm run gen:audio
```

Script đọc `data/listening/*.json`, tổng hợp từng lượt nói bằng đúng giọng đã khai
trong trường `voices`, rồi ghép thành `public/audio/lt-01-s1.mp3`, `lt-01-s2.mp3`...
Chạy một lần là xong; file MP3 nằm trong `public/` nên deploy lên Vercel là có luôn.

```bash
npm run gen:audio -- --force        # tạo lại tất cả
npm run gen:audio -- --test lt-01   # chỉ tạo cho một đề
```

edge-tts dùng giọng neural của Microsoft Edge, miễn phí và không giới hạn.

### Nghe lại đúng đoạn chứa đáp án

Sau khi nộp bài Listening và bấm **Xem lại từng câu**, mỗi câu có nút **Nghe đoạn này**
để phát lại đúng đoạn ghi âm chứa đáp án của câu đó.

Web tự dò đáp án nằm ở lượt nói nào trong transcript (hiểu được cả khi số được đọc
bằng chữ, ví dụ đáp án `550` trong câu "five hundred and fifty"), rồi quy ra mốc thời
gian trong file MP3. Nếu chưa có file mốc thời gian, mốc được ước lượng theo độ dài
từng lượt nói — vẫn dùng được, chỉ lệch vài giây nên đoạn phát được nới rộng ra hai đầu.

Muốn chính xác tuyệt đối thì chạy lại một lần:

```bash
npm run gen:audio -- --force
```

Lần chạy này ghi thêm `public/audio/<đề>-s<n>.timings.json` chứa mốc bắt đầu và kết
thúc của từng lượt nói. Có file đó rồi thì đoạn phát lại khớp chính xác. Các đề tạo
mới sau này sẽ tự có file mốc thời gian ngay từ đầu.

---

## 6. Thêm đề thi mới

**Cách 1 — sinh bằng AI (nhanh nhất)**

```bash
node scripts/generate-tests.mjs reading   "Năng lượng gió ngoài khơi"
node scripts/generate-tests.mjs listening "Đặt vé tàu"
node scripts/generate-tests.mjs writing   "Làm việc từ xa"
node scripts/generate-tests.mjs speaking  "Thể thao"
```

Script dùng chính `GEMINI_API_KEY` ở trên, tự đánh id tiếp theo, tự kiểm tra số thứ
tự câu hỏi và tính hợp lệ của biểu đồ.

- Writing và Speaking: đề mới được **tự động nối** vào `data/writing/tests.json` / `data/speaking/tests.json`, dùng được ngay
- Reading và Listening: đề mới nằm ở `data/reading/rt-03.json` hoặc `data/listening/lt-03.json`; registry hiện đã ghép các đề sinh ngắn thành đúng 3 passage / 4 section cho các đề mới.

```ts
import rt03 from "@/data/reading/rt-03.json";
export const READING_TESTS = [rt01, rt02, rt03] as unknown as ReadingTest[];
```

Với Listening, chạy thêm `npm run gen:audio` để tạo file MP3 cho đề mới.

> Luôn đọc lại đề AI sinh ra trước khi cho học viên dùng — AI thỉnh thoảng tạo câu
> hỏi mà đáp án không thực sự có trong bài.

**Cách 2 — tự viết tay**

Mở một file trong `data/` làm mẫu và copy cấu trúc. Toàn bộ kiểu dữ liệu được mô tả
trong `lib/types.ts`.

---

## 7. Deploy lên Vercel

Repo GitHub của dự án: https://github.com/HoangKha1810/English-AI

Vercel tự nhận diện Next.js từ `package.json`, nên không cần thêm adapter hoặc
`vercel.json`. Dự án yêu cầu Node.js `20.9+`.

### Cách deploy bằng GitHub

1. Vào https://vercel.com/new và chọn **Import Git Repository**
2. Chọn `HoangKha1810/English-AI`
3. Giữ nguyên Framework Preset là **Next.js**
4. Trong **Environment Variables**, thêm các biến trong `.env.local.example`
5. Bấm **Deploy**

Không commit `.env.local`. File này chứa API key và đã được `.gitignore` loại khỏi
repo. Dùng `.env.local.example` làm danh sách biến cần nhập vào Vercel:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GROQ_API_KEY`
- `GOOGLE_SITE_VERIFICATION` (chỉ cần nếu xác minh Search Console bằng HTML tag)

Nên thêm các biến cho cả **Production**, **Preview** và **Development** nếu bạn
muốn các branch/preview của Vercel có đầy đủ chức năng.

### Cách push các thay đổi tiếp theo

```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```

**Bước bắt buộc sau khi deploy:** quay lại Firebase Console →
**Authentication → Settings → Authorized domains → Add domain** → dán tên miền
Vercel (`ten-du-an.vercel.app`). Không làm bước này thì nút đăng nhập Google sẽ báo
lỗi `auth/unauthorized-domain`.

Mỗi lần `git push` sau đó Vercel sẽ tự deploy lại.

### SEO và Google Search Console

Các route SEO đã có sẵn:

- `https://english.khanhportfolio.info/robots.txt`
- `https://english.khanhportfolio.info/sitemap.xml`
- `https://english.khanhportfolio.info/og-image.png`

Sau khi deploy:

1. Vào https://search.google.com/search-console
2. Chọn **URL-prefix** và nhập `https://english.khanhportfolio.info/`
3. Chọn xác minh bằng **HTML tag**
4. Copy giá trị `content` trong thẻ `google-site-verification`
5. Thêm giá trị đó vào biến `GOOGLE_SITE_VERIFICATION` trên Vercel
6. Redeploy rồi bấm **Verify** trong Search Console
7. Trong Search Console, mở **Sitemaps** và gửi `sitemap.xml`

Nếu chọn xác minh bằng DNS, không cần biến `GOOGLE_SITE_VERIFICATION`; chỉ cần
thêm bản ghi TXT mà Google cung cấp vào nơi quản lý DNS của domain.

Preview khi gửi link dùng Open Graph title, description và ảnh thương hiệu. Các
ứng dụng chat có thể lưu cache link cũ; sau khi deploy hãy gửi lại link hoặc dùng
trình debug chia sẻ của nền tảng đó để yêu cầu đọc lại metadata.

---

## 8. Cấu trúc dự án

```
app/
  page.tsx                 trang chủ và workspace tiến độ
  ielts/[id]/              đề IELTS full gồm đủ 4 kỹ năng
  ielts/                   danh sách 10 đề full
  login/                   đăng nhập / đăng ký
  dashboard/               tiến độ, biểu đồ, lịch sử
  reading/[id]/            giao diện làm bài Reading
  listening/[id]/          giao diện làm bài Listening
  writing/[id]/            giao diện viết bài
  speaking/[id]/           giao diện ghi âm
  api/
    score-writing/         gọi Gemini chấm Writing
    score-speaking/        gọi Gemini chấm Speaking
    transcribe/            gọi Groq Whisper chuyển giọng nói thành văn bản

components/
  ui/                      Button, GlassCard, Badge, BandRing, ProgressBar
  exam/                    engine làm bài dùng chung cho Reading và Listening
  ChartRenderer.tsx        vẽ biểu đồ Writing Task 1 (cột / đường / tròn / bảng)
  ProgressChart.tsx        biểu đồ band theo thời gian

lib/
  types.ts                 toàn bộ kiểu dữ liệu đề thi
  band.ts                  bảng quy đổi điểm thô sang band IELTS
  grade.ts                 chấm Reading / Listening
  firebase.ts, storage.ts  Firebase + dự phòng localStorage
  gemini.ts                gọi Gemini ở chế độ JSON có schema
  progress.ts              lưu bài dở và khôi phục trạng thái làm bài

data/                      toàn bộ đề thi ở dạng JSON
scripts/                   sinh đề bằng AI, tạo audio bằng edge-tts
firestore.rules            quy tắc bảo mật Firestore
```

---

## 9. Những điều cần biết

**Về bản quyền.** Toàn bộ bài đọc, transcript, đề viết và câu hỏi speaking trong
`data/` đều là **nội dung gốc** được biên soạn riêng cho dự án này. Đừng chép đề từ
bộ Cambridge IELTS vào — đó là vi phạm bản quyền và là lý do nhiều website luyện thi
bị gỡ. IELTS là nhãn hiệu của British Council, IDP và Cambridge; dự án này không
liên kết với các tổ chức đó.

**Về độ chính xác của điểm.** Bảng quy đổi band trong `lib/band.ts` lấy theo bảng
công bố trong bộ Cambridge IELTS, đề thi thật có thể xê dịch ±0.5. Điểm Writing và
Speaking do AI chấm chỉ mang tính tham khảo để biết mình đang yếu ở tiêu chí nào —
không thay thế được giám khảo thật. Riêng Pronunciation, AI chỉ đọc transcript chứ
không nghe được âm thanh, nên phần đó là ước lượng gián tiếp.

**Muốn chấm phát âm chính xác hơn?** Dùng
[Azure Pronunciation Assessment](https://learn.microsoft.com/azure/ai-services/speech-service/how-to-pronunciation-assessment)
— chấm đến từng âm tiết (Accuracy, Fluency, Prosody), có tier miễn phí F0 vĩnh viễn
(đăng ký Azure cần thẻ nhưng F0 không bị tính tiền).

**Chi phí thực tế.** Với vài trăm người dùng hoạt động, toàn bộ dự án chạy ở mức
0 đồng. Mẹo để giữ như vậy: sinh sẵn đề bằng script rồi lưu vào `data/`, đừng gọi
LLM real-time mỗi lần có người vào làm bài — chỉ dùng AI cho khâu chấm Writing và
Speaking.
