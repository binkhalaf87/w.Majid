# WhatsApp Majid

منصة شخصية عربية لإدارة محادثات **WhatsApp Business** مباشرة عبر **Meta WhatsApp Cloud API**، دون Twilio أو 360dialog أو أي مزود وسيط.

## المزايا

- استقبال رسائل واتساب عبر Webhook موثّق بتوقيع `X-Hub-Signature-256`.
- حفظ المحادثات والرسائل وحالات الإرسال في PostgreSQL باستخدام Prisma.
- الرد اليدوي المباشر من لوحة عربية RTL متجاوبة.
- تحديث المحادثات تلقائيًا كل 3 ثوانٍ.
- عرض حالات `sent` و`delivered` و`read` و`failed`.
- إدارة القوالب عبر API وإرسال القوالب المعتمدة من Meta.
- فحص مباشر لصلاحية الاتصال ورقم واتساب الأعمال.
- حماية لوحة التحكم وواجهات API الخاصة بـ HTTP Basic Auth.
- وضع فاتح وداكن، وحالات تحميل وفراغ وأخطاء.

> لا يتضمن المشروع Claude أو أي ردود آلية بالذكاء الاصطناعي.

## المتطلبات

- Node.js 20 أو أحدث
- حساب Meta Developer وتطبيق من نوع Business
- رقم مضاف إلى WhatsApp Business Platform
- قاعدة بيانات PostgreSQL

## التشغيل محليًا

```bash
git clone https://github.com/binkhalaf87/w.Majid.git
cd w.Majid
npm install
cp .env.example .env.local
```

حدّث القيم في `.env.local`، ثم:

```bash
npm run db:deploy
npm run dev
```

افتح `http://localhost:3000`. سيطلب المتصفح اسم المستخدم وكلمة المرور المحددين في `ADMIN_USERNAME` و`ADMIN_PASSWORD`.

## إعداد Meta Developer Portal

### 1. إنشاء التطبيق وإضافة WhatsApp

1. افتح [Meta for Developers](https://developers.facebook.com/apps/).
2. أنشئ تطبيقًا من نوع **Business**.
3. من لوحة التطبيق اختر **Add product** ثم **WhatsApp**.
4. اربط التطبيق بحساب Meta Business المطلوب.

### 2. نسخ المعرفات

من **WhatsApp > API Setup** انسخ:

- `PHONE_NUMBER_ID`: معرّف رقم الهاتف.
- `WABA_ID`: معرّف حساب WhatsApp Business.
- `TOKEN`: أنشئ System User Token دائمًا بصلاحيات:
  - `whatsapp_business_messaging`
  - `whatsapp_business_management`

من **App settings > Basic** انسخ **App Secret** إلى `APP_SECRET`.

### 3. إعداد Webhook

بعد نشر المشروع، افتح **WhatsApp > Configuration** وأدخل:

```text
Callback URL: https://your-domain.com/api/webhook
Verify token: نفس قيمة VERIFY_TOKEN في متغيرات البيئة
```

بعد نجاح التحقق، اشترك في حقل **messages**. هذا الحقل يرسل الرسائل الواردة وتحديثات الحالات إلى نفس المسار.

### 4. وضع التطبيق في Live

أكمل بيانات التطبيق وسياسة الخصوصية ومتطلبات Meta، ثم حوّل التطبيق إلى **Live**. رقم الاختبار يعمل مع الأرقام المسموح بها فقط، بينما رقم الإنتاج يتطلب إعداد نشاط Meta بشكل صحيح.

## متغيرات البيئة

| المتغير | الوصف |
|---|---|
| `TOKEN` | رمز الوصول الدائم لـMeta |
| `PHONE_NUMBER_ID` | معرف رقم واتساب |
| `WABA_ID` | معرف حساب واتساب للأعمال |
| `VERIFY_TOKEN` | قيمة سرية تختارها للتحقق من Webhook |
| `APP_SECRET` | App Secret المستخدم للتحقق من توقيع Meta |
| `GRAPH_API_VERSION` | إصدار Graph API، والافتراضي `v20.0` |
| `DATABASE_URL` | رابط PostgreSQL |
| `ADMIN_USERNAME` | اسم دخول اللوحة، والافتراضي `majid` |
| `ADMIN_PASSWORD` | كلمة مرور قوية مطلوبة في الإنتاج |
| `NEXT_PUBLIC_POLL_MS` | فترة تحديث الواجهة، والحد الأدنى 3000ms |

لا تضف ملف `.env` أو `.env.local` إلى GitHub.

## القوالب

يجب إنشاء القالب واعتماده أولًا في WhatsApp Manager. بعد ذلك سجّله محليًا عبر:

```bash
curl -u majid:YOUR_PASSWORD -X POST https://your-domain.com/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"welcome_message","body":"مرحبًا {{1}}","category":"UTILITY","status":"APPROVED","language":"ar"}'
```

القوالب المحلية لا تنشئ قالبًا داخل Meta؛ هي فهرس للقوالب المعتمدة لتسهيل إرسالها من اللوحة.

## النشر على Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbinkhalaf87%2Fw.Majid)

1. اربط المستودع بـVercel.
2. أضف جميع متغيرات `.env.example` في Project Settings > Environment Variables.
3. اربط PostgreSQL خارجيًا مثل Neon أو Supabase.
4. نفّذ migration مرة واحدة ضد قاعدة الإنتاج:

```bash
npm run db:deploy
```

5. أعد النشر ثم استخدم رابط `/api/webhook` في Meta.

## مسارات API

| المسار | الطريقة | الوظيفة |
|---|---|---|
| `/api/webhook` | GET / POST | تحقق Meta واستقبال الرسائل والحالات |
| `/api/conversations` | GET | قائمة المحادثات والبحث |
| `/api/messages/[waId]` | GET / POST | السجل والإرسال اليدوي |
| `/api/templates` | GET / POST | عرض وإنشاء القوالب المحلية |
| `/api/templates/[id]` | PUT / DELETE | تعديل أو حذف قالب |
| `/api/templates/send` | POST | إرسال قالب معتمد |
| `/api/settings` | GET / PUT | إعدادات اسم المنصة |
| `/api/stats` | GET | الإحصائيات الأساسية |
| `/api/connection` | GET | فحص TOKEN ورقم الأعمال |
| `/api/health` | GET | فحص جاهزية الخدمة |

## ملاحظات أمنية وتشغيلية

- لا تُرسل الأسرار للواجهة؛ جميع اتصالات Meta تتم من الخادم.
- Webhook هو المسار العام الوحيد المهم، ويتحقق من HMAC باستخدام `APP_SECRET`.
- محدد المعدل الحالي يعمل داخل كل نسخة Serverless. للحمل الكبير استخدم مخزنًا مركزيًا مثل Redis.
- لا يمكن عادة إرسال رسالة نصية حرة بعد انتهاء نافذة خدمة العملاء البالغة 24 ساعة؛ استخدم قالبًا معتمدًا.
- عدّل `GRAPH_API_VERSION` بعد اختبار إصدار أحدث من Meta بدل تغيير الكود.

## أوامر المشروع

```bash
npm run dev          # تشغيل التطوير
npm run typecheck    # فحص TypeScript
npm run build        # بناء الإنتاج
npm run db:migrate   # إنشاء migration أثناء التطوير
npm run db:deploy    # تطبيق migrations في الإنتاج
npm run db:studio    # فتح Prisma Studio
```
