"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"
import Link from "next/link"
import { TiltCard } from "@/components/animations/tilt-card"

const plans = [
  {
    name: "Free",
    description: "Get started with basic resources",
    price: "0",
    period: "forever",
    features: [
      "Access to 2 semesters",
      "Basic video lectures",
      "Limited previous questions",
      "Community support",
      "Mobile access",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    description: "Everything you need to excel",
    price: "299",
    period: "per semester",
    features: [
      "Access to all semesters",
      "All video lectures",
      "All previous questions",
      "Exam suggestions",
      "Study notes",
      "Solved answers",
      "Progress tracking",
      "Priority support",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Lifetime",
    description: "One-time payment, forever access",
    price: "999",
    period: "one time",
    features: [
      "Everything in Pro",
      "Lifetime access",
      "All future updates",
      "Exclusive resources",
      "1-on-1 doubt clearing",
      "Certificate on completion",
    ],
    cta: "Get Lifetime",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative z-10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            Simple pricing.
          </h2>
          <p className="mt-6 text-xl text-slate-800 font-medium">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={plan.popular ? "relative" : ""}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                  <Badge className="bg-slate-900 text-yellow-400 border-none shadow-lg px-4 py-1 font-black uppercase tracking-widest text-[10px]">
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full rounded-[2.5rem] border-none p-8 ${plan.popular ? "bg-white shadow-2xl scale-105" : "bg-white/50 backdrop-blur-sm shadow-xl"} transition-all duration-300 hover:scale-[1.02]`}>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-3xl font-black text-slate-900">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-600 font-bold">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Price */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-black text-slate-400">৳</span>
                      <span className="text-6xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-2">{plan.period}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                          <Check className="w-3 h-3 text-yellow-400" />
                        </div>
                        <span className="text-sm text-slate-700 font-bold">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href="/login" className="block pt-4">
                    <Button
                      className={`w-full h-14 rounded-2xl text-lg font-black transition-all ${plan.popular ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20' : 'bg-transparent border-4 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
