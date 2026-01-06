import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import gridBg from "@assets/generated_images/dark_digital_circuit_board_background.png";

export default function Builds() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-15 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: "cover" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.18),transparent_60%)] opacity-80" />
      <div className="absolute -top-40 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        <Link href="/">
          <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest mb-10">
            Return Home
          </button>
        </Link>

        <section className="mb-14">
          <div className="inline-flex items-center gap-3 border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary">
            AeThex Builds
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight mt-6 mb-4">
            Everything We Ship
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
            AeThex OS is a multi-form build system: a live web OS, a bootable Linux ISO,
            and an Android app that mirrors the OS runtime. This page is the single
            source of truth for what exists, how to verify it, and how to build it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href="#build-matrix">Build Matrix</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#verification">Verification</a>
            </Button>
          </div>
        </section>

        <section id="build-matrix" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-primary/30" />
            <h2 className="text-sm uppercase tracking-[0.4em] text-primary">Build Matrix</h2>
            <div className="h-px flex-1 bg-primary/30" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-primary/30 bg-card/60 p-6 relative">
              <div className="absolute top-0 left-0 h-1 w-full bg-primary/60" />
              <h3 className="font-display text-xl uppercase text-white mb-2">AeThex OS Linux ISO</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bootable Linux build of the full AeThex OS desktop runtime. Designed for
                verification, demos, and on-device deployments.
              </p>
              <div className="text-xs uppercase tracking-widest text-secondary mb-2">Outputs</div>
              <div className="text-sm text-muted-foreground mb-4">
                `aethex-linux-build/AeThex-Linux-amd64.iso` plus checksum.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" asChild>
                  <a href="#verification">Verify ISO</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#iso-build">Build Guide</a>
                </Button>
              </div>
            </div>

            <div className="border border-secondary/30 bg-card/60 p-6 relative">
              <div className="absolute top-0 left-0 h-1 w-full bg-secondary/60" />
              <h3 className="font-display text-xl uppercase text-white mb-2">Android App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Capacitor + Android Studio build for mobile deployment. Mirrors the OS UI
                with native bridge hooks and mobile quick actions.
              </p>
              <div className="text-xs uppercase tracking-widest text-secondary mb-2">Status</div>
              <div className="text-sm text-muted-foreground mb-4">
                Build from source now. Distribution APK coming soon.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" asChild>
                  <a href="#android-build">Build Android</a>
                </Button>
                <Button variant="outline" disabled>
                  APK Coming Soon
                </Button>
              </div>
            </div>

            <div className="border border-white/10 bg-card/60 p-6 relative">
              <div className="absolute top-0 left-0 h-1 w-full bg-white/30" />
              <h3 className="font-display text-xl uppercase text-white mb-2">Web Client</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Primary OS surface for browsers. Ships continuously and powers live
                demos, admin panels, and the runtime workspace.
              </p>
              <div className="text-xs uppercase tracking-widest text-secondary mb-2">Status</div>
              <div className="text-sm text-muted-foreground mb-4">
                Live, iterating daily. Can be built locally or deployed on demand.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" asChild>
                  <a href="#web-build">Build Web</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/">Launch OS</a>
                </Button>
              </div>
            </div>

            <div className="border border-destructive/30 bg-card/60 p-6 relative">
              <div className="absolute top-0 left-0 h-1 w-full bg-destructive/60" />
              <h3 className="font-display text-xl uppercase text-white mb-2">iOS App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Native shell for Apple hardware. This will mirror the Android runtime with
                device-grade entitlements and mobile UX tuning.
              </p>
              <div className="text-xs uppercase tracking-widest text-secondary mb-2">Status</div>
              <div className="text-sm text-muted-foreground mb-4">
                Coming soon. Placeholder only until Apple hardware validation is complete.
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-16" id="verification">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-secondary/30" />
            <h2 className="text-sm uppercase tracking-[0.4em] text-secondary">Verification</h2>
            <div className="h-px flex-1 bg-secondary/30" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-secondary/30 bg-card/60 p-6">
              <h3 className="font-display text-lg uppercase text-white mb-3">ISO Integrity</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Run the verification script to confirm checksums and boot assets before
                you ship or demo.
              </p>
              <pre className="bg-black/40 border border-white/10 p-4 text-xs text-muted-foreground overflow-x-auto">
{`./script/verify-iso.sh -i aethex-linux-build/AeThex-Linux-amd64.iso
./script/verify-iso.sh -i AeThex-OS-Full-amd64.iso --mount`}
              </pre>
            </div>
            <div className="border border-primary/30 bg-card/60 p-6">
              <h3 className="font-display text-lg uppercase text-white mb-3">Artifact Checks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Always keep the ISO next to its checksum file. If the SHA changes, rebuild.
              </p>
              <pre className="bg-black/40 border border-white/10 p-4 text-xs text-muted-foreground overflow-x-auto">
{`ls -lh aethex-linux-build/*.iso
sha256sum -c aethex-linux-build/*.sha256`}
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-16" id="iso-build">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-primary/30" />
            <h2 className="text-sm uppercase tracking-[0.4em] text-primary">ISO Build</h2>
            <div className="h-px flex-1 bg-primary/30" />
          </div>
          <div className="border border-primary/30 bg-card/60 p-6">
            <p className="text-sm text-muted-foreground mb-4">
              The ISO build is scripted and reproducible. Use the full build script for a
              complete OS image with the desktop runtime.
            </p>
            <pre className="bg-black/40 border border-white/10 p-4 text-xs text-muted-foreground overflow-x-auto">
{`sudo bash script/build-linux-iso.sh
# Output: aethex-linux-build/AeThex-Linux-amd64.iso`}
            </pre>
          </div>
        </section>

        <section className="mb-16" id="android-build">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-secondary/30" />
            <h2 className="text-sm uppercase tracking-[0.4em] text-secondary">Android Build</h2>
            <div className="h-px flex-1 bg-secondary/30" />
          </div>
          <div className="border border-secondary/30 bg-card/60 p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Build the web bundle first, then sync to Capacitor and run the Gradle build.
            </p>
            <pre className="bg-black/40 border border-white/10 p-4 text-xs text-muted-foreground overflow-x-auto">
{`npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug`}
            </pre>
            <p className="text-xs text-muted-foreground mt-4">
              The APK output will be in `android/app/build/outputs/apk/`.
            </p>
          </div>
        </section>

        <section className="mb-16" id="web-build">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-primary/30" />
            <h2 className="text-sm uppercase tracking-[0.4em] text-primary">Web Client</h2>
            <div className="h-px flex-1 bg-primary/30" />
          </div>
          <div className="border border-primary/30 bg-card/60 p-6">
            <p className="text-sm text-muted-foreground mb-4">
              The web OS runs on Vite + React. Use dev mode for iteration, build for production.
            </p>
            <pre className="bg-black/40 border border-white/10 p-4 text-xs text-muted-foreground overflow-x-auto">
{`npm install
npm run dev
# or
npm run build`}
            </pre>
          </div>
        </section>

        <section className="mb-8">
          <div className="border border-white/10 bg-card/60 p-6">
            <h2 className="font-display text-2xl uppercase text-white mb-4">The Big Explainer</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              AeThex OS is not a single app. It is a multi-surface operating system that
              treats the browser, desktop, and phone as interchangeable launch nodes for
              the same living runtime. The web client is the living core. The Linux ISO
              proves the OS can boot, isolate a runtime, and ship offline. The Android app
              turns the OS into a pocket terminal with native bridge hooks. iOS is planned
              to mirror the mobile stack once Apple hardware validation is complete.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If you are an investor or partner, this is a platform bet: an OS that ships
              across formats, built on a single codebase, with verifiable artifacts and
              a real deployment pipeline. The deliverable is not hype. It is a build matrix
              you can reproduce, verify, and ship.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
