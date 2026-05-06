import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | EduMatrix",
  description: "EduMatrix terms of service and usage conditions.",
}

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 prose dark:prose-invert">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: May 6, 2026</p>
      
      <section className="mt-12">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using EduMatrix, you agree to be bound by these Terms of Service.
        </p>
      </section>

      <section className="mt-8">
        <h2>2. Use of Services</h2>
        <p>
          You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account information.
        </p>
      </section>

      <section className="mt-8">
        <h2>3. Content Rights</h2>
        <p>
          The materials provided on EduMatrix are for educational purposes. Users may not redistribute or sell any content obtained from the platform without explicit permission.
        </p>
      </section>

      <section className="mt-8">
        <h2>4. Limitation of Liability</h2>
        <p>
          EduMatrix is provided "as is" without any warranties. We are not liable for any damages arising from your use of the platform.
        </p>
      </section>

      <section className="mt-8">
        <h2>5. Termination</h2>
        <p>
          We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms.
        </p>
      </section>
    </div>
  )
}
