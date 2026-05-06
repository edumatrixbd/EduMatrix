import Link from "next/link"
import { AlertCircle, ArrowLeft, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupabaseSetupPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <CardTitle>Supabase is not configured</CardTitle>
          <CardDescription>
            The admin panel needs your Supabase project URL and anon key before authentication can run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing environment variables</AlertTitle>
            <AlertDescription>
              Create a <code className="rounded bg-muted px-1 py-0.5">.env.local</code> file from{" "}
              <code className="rounded bg-muted px-1 py-0.5">.env.example</code>, then restart the dev server.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <pre className="whitespace-pre-wrap break-all">{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_EMAILS=your-admin-email@example.com`}</pre>
          </div>

          <p className="text-sm text-muted-foreground">
            You can find these values in Supabase Dashboard → Project Settings → API.
          </p>

          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
