//Library
import { Shield } from "lucide-react";
//Next
import Link from "next/link";
//Own components
import { footerLinks } from "../constants";

const date = new Date();

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md gradient-solana flex items-center justify-center">
                <Shield className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">
                Stayke
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Decentralized stays secured by staking on Solana.
            </p>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 font-display text-sm font-semibold text-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {date.getFullYear()} Stayke. Built on Solana.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
