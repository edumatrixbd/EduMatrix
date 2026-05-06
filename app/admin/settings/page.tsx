"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Settings, 
  Shield, 
  Globe, 
  Layout, 
  Share2, 
  Save, 
  Loader2,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Github,
  Linkedin,
  Search
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({
    promo_banner_text: "",
    promo_banner_cta: "",
    show_promo_banner: true,
    maintenance_mode: false,
    contact_email: "",
    contact_phone: "",
    social_links: { facebook: "", twitter: "", github: "", linkedin: "" },
    seo_title: "",
    seo_description: ""
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .maybeSingle()
      
      if (error) throw error
      if (data) setSettings(data)
    } catch (error: any) {
      console.error("Error fetching settings:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Database table 'site_settings' missing. Please run the SQL script.")
      } else {
        toast.error("Failed to load settings: " + (error?.message || "Unknown error"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("site_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq("id", settings.id)

      if (error) throw error
      toast.success("Settings updated successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Website Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global platform behavior and content</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Homepage Control */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" />
              Homepage Control
            </CardTitle>
            <CardDescription>Manage your landing page promo banner and CTA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div>
                <p className="font-medium text-sm">Show Promo Banner</p>
                <p className="text-xs text-muted-foreground">Toggle visibility on the homepage</p>
              </div>
              <Switch 
                checked={settings.show_promo_banner} 
                onCheckedChange={(val) => setSettings({...settings, show_promo_banner: val})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerText">Banner Text</Label>
              <Textarea 
                id="bannerText" 
                value={settings.promo_banner_text}
                onChange={(e) => setSettings({...settings, promo_banner_text: e.target.value})}
                placeholder="Enter banner message..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerCta">CTA Button Text</Label>
              <Input 
                id="bannerCta" 
                value={settings.promo_banner_cta}
                onChange={(e) => setSettings({...settings, promo_banner_cta: e.target.value})}
                placeholder="e.g. Join Now"
              />
            </div>
          </CardContent>
        </Card>

        {/* Website Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Website Configuration
            </CardTitle>
            <CardDescription>General platform settings and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 p-4 bg-amber-500/5">
              <div>
                <p className="font-medium text-sm text-amber-500">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Redirect all visitors to maintenance page</p>
              </div>
              <Switch 
                checked={settings.maintenance_mode}
                onCheckedChange={(val) => setSettings({...settings, maintenance_mode: val})}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="contactEmail" 
                    value={settings.contact_email}
                    onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="contactPhone" 
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              SEO Control
            </CardTitle>
            <CardDescription>Optimize how your platform appears in search results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">Site Title</Label>
              <Input 
                id="seoTitle" 
                value={settings.seo_title}
                onChange={(e) => setSettings({...settings, seo_title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDesc">Meta Description</Label>
              <Textarea 
                id="seoDesc" 
                value={settings.seo_description}
                onChange={(e) => setSettings({...settings, seo_description: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Social Links
            </CardTitle>
            <CardDescription>Configure external links for your footer and contact pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </Label>
                <Input 
                  value={settings.social_links.facebook}
                  onChange={(e) => setSettings({
                    ...settings, 
                    social_links: {...settings.social_links, facebook: e.target.value}
                  })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Twitter className="w-3.5 h-3.5" /> Twitter
                </Label>
                <Input 
                  value={settings.social_links.twitter}
                  onChange={(e) => setSettings({
                    ...settings, 
                    social_links: {...settings.social_links, twitter: e.target.value}
                  })}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Github className="w-3.5 h-3.5" /> Github
                </Label>
                <Input 
                  value={settings.social_links.github}
                  onChange={(e) => setSettings({
                    ...settings, 
                    social_links: {...settings.social_links, github: e.target.value}
                  })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Linkedin className="w-3.5 h-3.5" /> Linkedin
                </Label>
                <Input 
                  value={settings.social_links.linkedin}
                  onChange={(e) => setSettings({
                    ...settings, 
                    social_links: {...settings.social_links, linkedin: e.target.value}
                  })}
                  placeholder="https://linkedin.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

