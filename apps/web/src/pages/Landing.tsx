import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Utensils, QrCode, MessageCircle, BarChart3, Zap, Shield } from "lucide-react";
import { mockPlans } from "@/data/mock";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";

const features = [
  { icon: Utensils, title: "Cardápio Digital", desc: "Crie um cardápio profissional em minutos, com categorias, fotos e modificadores." },
  { icon: QrCode, title: "Mesas com QR Code", desc: "Cada mesa com seu QR Code único. O cliente escaneia e já vê o cardápio." },
  { icon: MessageCircle, title: "Kit WhatsApp", desc: "Templates prontos para atendimento, respostas rápidas e perfil profissional." },
  { icon: BarChart3, title: "Dashboard Analítico", desc: "Acompanhe visualizações, cliques e itens mais acessados em tempo real." },
  { icon: Zap, title: "Pipeline de Vendas", desc: "Gerencie leads e oportunidades com um kanban intuitivo." },
  { icon: Shield, title: "Seguro e Confiável", desc: "Seus dados protegidos com criptografia e backups automáticos." },
];

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Cadastro rápido, sem cartão de crédito." },
  { num: "02", title: "Monte seu cardápio", desc: "Adicione itens, categorias e fotos." },
  { num: "03", title: "Compartilhe", desc: "Link público, QR codes e WhatsApp prontos." },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFull} alt="Comanda Flow" className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button variant="hero" size="sm">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30 L30 60Z' fill='none' stroke='%23ff8c00' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px"
        }} />
        <div className="container py-20 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
              <Badge className="mb-4 gradient-primary text-primary-foreground border-0">
                Novo — Pipeline de Vendas 🚀
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white leading-tight mb-6">
                Onde a Gestão<br />
                Encontra o <span className="text-gradient">Ritmo</span>
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Cardápio digital, mesas com QR Code, WhatsApp integrado e dashboard analítico. Tudo o que seu restaurante precisa em um só lugar.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth?tab=signup">
                  <Button variant="hero" size="lg" className="text-base px-8">
                    Começar Grátis <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/m/general-burguer/menu">
                  <Button variant="hero-outline" size="lg" className="text-base px-8 border-white/30 text-white hover:bg-white/10 hover:text-white">
                    Ver Demonstração
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:block"
            >
              <img src={heroImage} alt="Dashboard do Comanda Flow" className="rounded-2xl shadow-2xl border border-white/10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Pronto em <span className="text-primary">30 minutos</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Configure seu restaurante digital em três passos simples.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-heading font-bold text-primary-foreground">{step.num}</span>
                </div>
                <h3 className="text-xl font-heading font-bold mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 bg-muted/30">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Tudo que você precisa</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Ferramentas poderosas para transformar a gestão do seu restaurante.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Planos para cada momento</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Comece grátis e evolua conforme seu negócio cresce.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-card rounded-xl p-6 border transition-all duration-300 hover:shadow-card-hover ${
                  plan.popular ? "border-primary shadow-primary" : "border-border shadow-card"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground border-0">
                    Mais Popular
                  </Badge>
                )}
                <h3 className="font-heading font-bold text-lg text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-heading font-extrabold text-foreground">
                    {plan.price === 0 ? "Grátis" : `R$${plan.price.toFixed(0)}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-muted-foreground">/mês</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?tab=signup">
                  <Button variant={plan.popular ? "hero" : "outline"} className="w-full">
                    {plan.price === 0 ? "Começar Grátis" : "Assinar"}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='%23ff8c00'/%3E%3C/svg%3E")`,
          backgroundSize: "40px 40px"
        }} />
        <div className="container text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Pronto para encontrar o ritmo?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">Comece grátis, sem compromisso. Seu restaurante digital em 30 minutos.</p>
          <Link to="/auth?tab=signup">
            <Button variant="hero" size="lg" className="text-base px-10">
              Começar Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Comanda Flow" className="h-6" />
            <span className="text-sm text-muted-foreground">© 2026 Comanda Flow. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
