import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Bot, Bell, FileText, IndianRupee, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary" data-testid="logo-icon" />
            <span className="text-xl font-bold font-display" data-testid="text-brand-name">Interex</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">Log In</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="button-get-started">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" data-testid="badge-save-money">
                Save ₹16+ Lakhs on Your Home Loan
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-6" data-testid="text-hero-heading">
                The Future of Interest Negotiation
              </h1>
              <p className="text-lg text-muted-foreground mb-8" data-testid="text-hero-description">
                AI-powered home loan optimization for Indian homeowners. Automated rate monitoring, intelligent prepayment strategies, and bank negotiations—all in one platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8" data-testid="button-start-free">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-12 px-8" data-testid="button-watch-demo">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Bank-grade security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 border border-primary/20">
                <div className="space-y-4">
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Your Savings Potential</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-mono font-bold text-primary">₹16,24,000</div>
                      <p className="text-xs text-muted-foreground mt-1">Over loan lifetime</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Tenure Reduction</div>
                          <div className="text-2xl font-mono font-bold">12 Years</div>
                        </div>
                        <TrendingDown className="w-10 h-10 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4" data-testid="text-features-heading">
              Powerful Features for Maximum Savings
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-description">
              Everything you need to optimize your home loan and save lakhs in interest
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Bell className="w-8 h-8" />,
                title: "Automated Rate Monitoring",
                description: "24/7 tracking of RBI repo rates and 20+ bank interest rates. Get instant alerts when opportunities arise.",
                testId: "card-feature-monitoring"
              },
              {
                icon: <TrendingDown className="w-8 h-8" />,
                title: "Smart Prepayment Calculator",
                description: "Interactive tool showing EMI vs tenure impact with complete amortization schedules and savings projections.",
                testId: "card-feature-calculator"
              },
              {
                icon: <Bot className="w-8 h-8" />,
                title: "AI Financial Advisor",
                description: "24/7 chatbot powered by AI giving personalized advice based on your specific loan details and financial situation.",
                testId: "card-feature-ai-advisor"
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: "Auto-Negotiation Letters",
                description: "AI-generated professional letters to banks citing market rates, payment history, and repo rate changes.",
                testId: "card-feature-negotiation"
              },
              {
                icon: <IndianRupee className="w-8 h-8" />,
                title: "Savings Reports",
                description: "Monthly and annual reports with AI-generated narratives, visualizations, and actionable insights.",
                testId: "card-feature-reports"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Secure & Private",
                description: "Bank-grade encryption, no data sharing with third parties. Your financial information stays completely secure.",
                testId: "card-feature-security"
              },
            ].map((feature, idx) => (
              <Card key={idx} className="border hover-elevate transition-all" data-testid={feature.testId}>
                <CardHeader>
                  <div className="mb-4 text-primary">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4" data-testid="text-pricing-heading">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="text-pricing-description">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2" data-testid="card-plan-free">
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">FREE</Badge>
                <CardTitle className="text-2xl font-display">Basic</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-mono">₹0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {["1 loan tracking", "Basic prepayment calculator", "Manual rate checks", "Email notifications"].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full" data-testid="button-start-free-plan">
                    Start Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-primary relative" data-testid="card-plan-premium">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">MOST POPULAR</Badge>
              </div>
              <CardHeader>
                <Badge variant="default" className="w-fit mb-2">PREMIUM</Badge>
                <CardTitle className="text-2xl font-display">Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-mono">₹299</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {["Unlimited loans", "AI-powered advisor 24/7", "Auto-negotiation letters", "Advanced analytics & reports", "Real-time rate alerts", "Priority support"].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full" data-testid="button-start-premium-plan">
                    Start Premium Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="w-5 h-5 text-primary" />
                <span className="font-bold font-display">Interex</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered home loan optimization for Indian homeowners.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 Interex. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
