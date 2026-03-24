export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-tertiary">
            ShopEase &mdash; Deployed on{" "}
            <a
              href="https://strettch.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text underline underline-offset-2"
            >
              Strettch Cloud
            </a>{" "}
            with Coolify
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/strettch/coolify-nextjs-store"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-tertiary hover:text-text transition-colors"
            >
              Source Code
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
