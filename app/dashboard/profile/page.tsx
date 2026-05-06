"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, User, Lock, CreditCard, Sparkles, CalendarDays, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Profile state
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [joinedDate, setJoinedDate] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [academicData, setAcademicData] = useState({
    university: "",
    department: "",
    batch: "",
    semester: ""
  })
  
  // Password state
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || "")
        setAvatarUrl(user.user_metadata?.avatar_url || "")
        if (user.created_at) {
          setJoinedDate(format(new Date(user.created_at), 'MMMM do, yyyy'))
        }

        // Fetch academic data from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('university, department, batch, semester')
          .eq('id', user.id)
          .single()

        if (profile) {
          setAcademicData({
            university: profile.university || "",
            department: profile.department || "",
            batch: profile.batch || "",
            semester: profile.semester?.toString() || ""
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }
      
      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`
      
      const supabase = createClient()
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })
        
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      
      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      })
      
      if (updateError) throw updateError
      
      setAvatarUrl(data.publicUrl)
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      })
      
      // Attempt to update students table if exists
      if (user?.id) {
        await supabase.from("profiles").update({ 
          // Note: Add avatar_url column to your students table if you want to store it there too
        }).eq("id", user.id)
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error uploading image.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      const supabase = createClient()
      
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })
      
      if (authError) throw authError
      
      // Update profiles table
      if (user?.id) {
        const { error: dbError } = await supabase
          .from("profiles")
          .update({ 
            name: fullName,
            university: academicData.university,
            department: academicData.department,
            batch: academicData.batch,
            semester: parseInt(academicData.semester) || null
          })
          .eq("id", user.id)
          
        if (dbError) throw dbError
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error updating profile.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.")
      }
      
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.")
      }
      
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error
      
      setPassword("")
      setConfirmPassword("")
      toast({
        title: "Success",
        description: "Password updated successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error updating password.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center">Loading settings...</div>
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Lock className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-medium">
                    {fullName ? fullName.split(" ").map(n => n[0]).join("") : "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2 flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors">
                      {uploadingAvatar ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Change Picture
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. Max size of 2MB.
                  </p>
                </div>

                {joinedDate && (
                  <div className="hidden sm:flex flex-col items-end text-sm text-muted-foreground ml-auto bg-muted/30 p-3 rounded-lg border border-border">
                    <span className="flex items-center gap-1.5 mb-1"><CalendarDays className="w-4 h-4" /> Member since</span>
                    <span className="font-medium text-foreground">{joinedDate}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
                </div>

                <div className="space-y-2 max-w-md">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input 
                      id="university" 
                      value={academicData.university} 
                      onChange={(e) => setAcademicData({...academicData, university: e.target.value})}
                      placeholder="e.g. Harvard University"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      value={academicData.department} 
                      onChange={(e) => setAcademicData({...academicData, department: e.target.value})}
                      placeholder="e.g. CSE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch</Label>
                    <Input 
                      id="batch" 
                      value={academicData.batch} 
                      onChange={(e) => setAcademicData({...academicData, batch: e.target.value})}
                      placeholder="e.g. 65"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Current Semester</Label>
                    <Input 
                      id="semester" 
                      type="number"
                      value={academicData.semester} 
                      onChange={(e) => setAcademicData({...academicData, semester: e.target.value})}
                      placeholder="e.g. 1"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="border-primary/20 shadow-premium overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-32 h-32 text-primary" />
            </div>
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Current Plan
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">PRO</Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">You are currently on the premium student tier.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Billing Cycle</span>
                  <span className="text-muted-foreground">Semester (6 Months)</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Next Payment</span>
                  <span className="text-muted-foreground">Dec 1, 2026</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-primary">৳499</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Included Features</h4>
                <ul className="space-y-2">
                  {['Unlimited Video Lectures', 'Premium Study Notes', 'Previous Year Questions', 'Priority Support'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Payment infrastructure is currently being upgraded.</p>
              <Button variant="outline">Manage Billing</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
