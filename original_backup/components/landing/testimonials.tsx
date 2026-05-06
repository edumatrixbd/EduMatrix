"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Rafiq Ahmed",
    role: "CSE Student, Semester 6",
    content: "DIU CSE Hub completely changed how I prepare for exams. The previous questions with solutions are incredibly helpful. Scored 3.8 GPA last semester!",
    rating: 5,
    avatar: "RA",
  },
  {
    name: "Fatima Akter",
    role: "CSE Student, Semester 4",
    content: "The video lectures are so well-organized. I can study at my own pace and the suggestions section helps me focus on what actually matters for exams.",
    rating: 5,
    avatar: "FA",
  },
  {
    name: "Mehedi Hasan",
    role: "CSE Student, Semester 5",
    content: "Best investment for my studies. The solved answers helped me understand problem-solving patterns. Highly recommend to all DIU CSE students!",
    rating: 5,
    avatar: "MH",
  },
  {
    name: "Nusrat Jahan",
    role: "CSE Student, Semester 3",
    content: "I was struggling with Data Structures until I found this platform. The notes are concise and the videos explain complex topics simply.",
    rating: 5,
    avatar: "NJ",
  },
  {
    name: "Tanvir Rahman",
    role: "CSE Student, Semester 7",
    content: "Using DIU CSE Hub since my 3rd semester. It is like having a senior mentor available 24/7. The suggestions are always on point!",
    rating: 5,
    avatar: "TR",
  },
  {
    name: "Sadia Islam",
    role: "CSE Student, Semester 4",
    content: "The platform saved me during finals week. Having all resources in one place made revision so much easier. Thank you DIU CSE Hub!",
    rating: 5,
    avatar: "SI",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Loved by{" "}
            <span className="gradient-text">thousands of students</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            See what DIU CSE students are saying about their experience
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-premium transition-all duration-300">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-foreground leading-relaxed mb-6">
                    {`"${testimonial.content}"`}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
