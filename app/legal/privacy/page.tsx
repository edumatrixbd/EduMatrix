import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | tensionনাই",
  description: "tensionনাই privacy policy and data handling information.",
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 prose dark:prose-invert">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: May 6, 2026</p>
      
      <section className="mt-12">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you create an account, such as your name, email address, university, department, and semester.
        </p>
      </section>

      <section className="mt-8">
        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Provide, maintain, and improve our services.</li>
          <li>Personalize your experience based on your academic status.</li>
          <li>Send you technical notices, updates, and security alerts.</li>
          <li>Monitor and analyze trends, usage, and activities.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2>3. Data Security</h2>
        <p>
          We use industry-standard security measures to protect your personal information from unauthorized access, use, or disclosure.
        </p>
      </section>

      <section className="mt-8">
        <h2>4. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at support@tensionনাই.com.
        </p>
      </section>
    </div>
  )
}
