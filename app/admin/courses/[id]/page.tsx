"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    description: "",
    instructor: "",
    credits: "3",
    semester: "1",
    price: "0",
    status: "active",
  })

  useEffect(() => {
    const fetchCourse = async () => {
      const response = await fetch(`/api/admin/courses/${id}`)
      const data = await response.json()
      setFormData({
        course_code: data.course_code ?? "",
        course_name: data.course_name ?? "",
        description: data.description ?? "",
        instructor: data.instructor ?? "",
        credits: String(data.credits ?? 3),
        semester: String(data.semester ?? 1),
        price: String(data.price ?? 0),
        status: data.status ?? "active",
      })
      setLoading(false)
    }

    fetchCourse()
  }, [id])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        credits: parseInt(formData.credits),
        semester: parseInt(formData.semester),
        price: parseFloat(formData.price),
      }),
    })
    setSaving(false)
    router.push("/admin/courses")
  }

  if (loading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Loading course...</CardContent></Card>
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">Update course details</p>
        </div>
      </motion.div>

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input id="course_code" name="course_code" value={formData.course_code} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course_name">Course Name</Label>
                <Input id="course_name" name="course_name" value={formData.course_name} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input id="instructor" name="instructor" value={formData.instructor} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (৳)</Label>
                <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input id="credits" name="credits" type="number" min="1" max="6" value={formData.credits} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7,8].map((sem) => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Link href="/admin/courses"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
