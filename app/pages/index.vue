<template>
  <div class="bg-[#050811] text-white">
    <Shade />

    <!-- Features -->
    <section class="px-8 py-32 max-w-6xl mx-auto">
      <div class="max-w-2xl mb-20">
        <p class="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">Plattform</p>
        <h2 class="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
          Schneller bauen.<br />Skaliert wenn du es brauchst.
        </h2>
        <p class="mt-6 text-lg text-white/60 leading-relaxed">
          Eine Infrastruktur, die mit dir wächst — vom ersten Prototyp bis zur
          globalen Auslieferung. Keine versteckten Limits, keine Migration im
          dritten Quartal.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
        <div class="bg-[#050811] p-8">
          <div class="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-lg">⚡</div>
          <h3 class="text-xl font-medium mb-3">Echtzeit-Performance</h3>
          <p class="text-white/55 text-sm leading-relaxed">
            Sub-50ms-Latenz weltweit. Edge-Routing in 30+ Regionen, ohne dass
            du eine einzige Zeile Konfiguration schreiben musst.
          </p>
        </div>
        <div class="bg-[#050811] p-8">
          <div class="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-lg">⌘</div>
          <h3 class="text-xl font-medium mb-3">In drei Zeilen integriert</h3>
          <p class="text-white/55 text-sm leading-relaxed">
            SDKs für TypeScript, Python und Go. Saubere APIs ohne Magie. Was du
            in der Doku liest, ist auch das, was im Produktionscode steht.
          </p>
        </div>
        <div class="bg-[#050811] p-8">
          <div class="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-lg">◎</div>
          <h3 class="text-xl font-medium mb-3">Für ernst gemeintes Wachstum</h3>
          <p class="text-white/55 text-sm leading-relaxed">
            Audit-Logs, SSO, dedizierte Capacity. Compliance-Material auf
            Anfrage. Wenn du eine Million Requests pro Sekunde machst, sind wir
            schon vor dir wach.
          </p>
        </div>
      </div>
    </section>

    <!-- Stats strip -->
    <section class="border-y border-white/10 bg-white/1.5">
      <div class="px-8 py-16 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
        <div>
          <div class="text-4xl md:text-5xl font-medium tracking-tight">99,99%</div>
          <div class="mt-2 text-xs uppercase tracking-wider text-white/50">Uptime, vertraglich</div>
        </div>
        <div>
          <div class="text-4xl md:text-5xl font-medium tracking-tight">&lt;50ms</div>
          <div class="mt-2 text-xs uppercase tracking-wider text-white/50">P95-Latenz weltweit</div>
        </div>
        <div>
          <div class="text-4xl md:text-5xl font-medium tracking-tight">12 Mio</div>
          <div class="mt-2 text-xs uppercase tracking-wider text-white/50">Requests pro Tag</div>
        </div>
        <div>
          <div class="text-4xl md:text-5xl font-medium tracking-tight">250+</div>
          <div class="mt-2 text-xs uppercase tracking-wider text-white/50">Teams in Produktion</div>
        </div>
      </div>
    </section>

    <!-- Testimonial -->
    <section class="px-8 py-32 max-w-4xl mx-auto">
      <p class="text-xs uppercase tracking-[0.2em] text-white/50 mb-8">Was Kunden sagen</p>
      <blockquote class="text-2xl md:text-3xl font-medium tracking-tight leading-snug">
        „Wir haben drei Tage damit verbracht, die Migration zu planen — und
        zwei Stunden mit der Umsetzung. Demo Co. hat uns ein Quartal an
        Engineering-Aufwand erspart."
      </blockquote>
      <div class="mt-8 flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-white/30 to-white/5"></div>
        <div>
          <div class="font-medium">Lena Weiss</div>
          <div class="text-sm text-white/50">CTO, Northpoint Systems</div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-8 py-32 max-w-4xl mx-auto text-center">
      <h2 class="text-4xl md:text-6xl font-medium tracking-tight leading-[1.05]">
        Bereit, das auszuprobieren?
      </h2>
      <p class="mt-6 text-lg text-white/60 max-w-xl mx-auto">
        Kostenloser Start ohne Kreditkarte. Erste Million Requests im Monat
        gehen aufs Haus.
      </p>
      <div class="mt-10 flex items-center justify-center gap-3">
        <Button class="bg-white text-black hover:bg-white/90">Kostenlos starten</Button>
        <Button variant="outline" class="border-white/20 text-white hover:bg-white/10 bg-transparent">Demo buchen</Button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10">
      <div class="px-8 py-16 max-w-6xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div class="col-span-2 md:col-span-1">
            <div class="text-lg font-semibold tracking-tight">Demo Co.</div>
            <p class="mt-3 text-sm text-white/50 max-w-xs">
              Infrastruktur, die nicht im Weg steht.
            </p>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-white/40 mb-4">Produkt</div>
            <ul class="space-y-2 text-sm text-white/70">
              <li><a href="#" class="hover:text-white">Platform</a></li>
              <li><a href="#" class="hover:text-white">Pricing</a></li>
              <li><a href="#" class="hover:text-white">Changelog</a></li>
              <li><a href="#" class="hover:text-white">Status</a></li>
            </ul>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-white/40 mb-4">Unternehmen</div>
            <ul class="space-y-2 text-sm text-white/70">
              <li><a href="#" class="hover:text-white">Über uns</a></li>
              <li><a href="#" class="hover:text-white">Karriere</a></li>
              <li><a href="#" class="hover:text-white">Newsroom</a></li>
              <li><a href="#" class="hover:text-white">Kontakt</a></li>
            </ul>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-white/40 mb-4">Ressourcen</div>
            <ul class="space-y-2 text-sm text-white/70">
              <li><a href="#" class="hover:text-white">Docs</a></li>
              <li><a href="#" class="hover:text-white">Guides</a></li>
              <li><a href="#" class="hover:text-white">API-Referenz</a></li>
              <li><a href="#" class="hover:text-white">Community</a></li>
            </ul>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-white/40 mb-4">Rechtliches</div>
            <ul class="space-y-2 text-sm text-white/70">
              <li><a href="#" class="hover:text-white">Datenschutz</a></li>
              <li><a href="#" class="hover:text-white">AGB</a></li>
              <li><a href="#" class="hover:text-white">Impressum</a></li>
              <li><a href="#" class="hover:text-white">DPA</a></li>
            </ul>
          </div>
        </div>

        <div class="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-white/40">
          <div>© 2026 Demo Co. — Alle Rechte vorbehalten.</div>
          <div class="flex gap-4">
            <a href="#" class="hover:text-white/70">GitHub</a>
            <a href="#" class="hover:text-white/70">LinkedIn</a>
            <a href="#" class="hover:text-white/70">X</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>
