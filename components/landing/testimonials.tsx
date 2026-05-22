"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"

const testimonials = [
  {
    text: "tensionনাই is literally a lifesaver. The solved previous questions saved me so much time during my final exams.",
    author: "Samiur Rahman",
    uni: "BUET",
    img: "https://i.pravatar.cc/100?img=12"
  },
  {
    text: "The quality of video lectures is top-notch. Everything is explained in a way that actually makes sense.",
    author: "Anika Tabassum",
    uni: "NSU",
    img: "https://i.pravatar.cc/100?img=45"
  },
  {
    text: "Finally, a platform that understands what students actually need before an exam. Highly recommended!",
    author: "Fahim Ahmed",
    uni: "DU",
    img: "https://i.pravatar.cc/100?img=32"
  }
]

export function Testimonials() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
            Loved by Students
          </h2>
          <p className="text-xl text-slate-800 font-medium max-w-2xl mx-auto">
            Join thousands of students who have already transformed their learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <Quote className="w-10 h-10 text-yellow-400 mb-6" />
                <p className="text-lg text-slate-700 font-medium italic leading-relaxed mb-8">
                  "{t.text}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <img src={t.img} alt={t.author} className="w-12 h-12 rounded-full bg-slate-200" />
                <div>
                  <p className="font-black text-slate-900 leading-none mb-1">{t.author}</p>
                  <p className="text-sm text-slate-500 font-bold">{t.uni}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
