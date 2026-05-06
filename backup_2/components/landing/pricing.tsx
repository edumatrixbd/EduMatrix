"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"
import Link from "next/link"

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
    <section id="pricing" className="py-20 sm:py-28">
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
            Simple,{" "}
            <span className="gradient-text">affordable pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Choose the plan that fits your needs. All plans include core study materials.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
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
                  <Badge className="bg-primary text-primary-foreground shadow-lg px-4 py-1">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full ${plan.popular ? "border-primary shadow-premium-lg scale-105" : "hover:shadow-premium"} transition-all duration-300`}>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-lg text-muted-foreground">৳</span>
                      <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href="/login" className="block">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
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
