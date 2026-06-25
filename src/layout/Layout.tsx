import { Helmet } from "react-helmet";
import { Navbar } from "../components/ui/index";
import { NAV_LINKS } from "../helpers/NavbarLinksHelper";
import Footer from "../components/ui/Footer";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/index";

interface ILayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  keyword?: string;
  author?: string;
  navbar: true;
  footer: true;
}

const Layout = (props: ILayoutProps) => {
  const { children, title, description, keyword, author, navbar, footer } = props;
  const state = useAppSelector((state) => state.auth)
  return (
    <div>
      <Helmet>
        <meta charSet="utf-8" />
        <meta charSet="description" content={description} />
        <meta charSet="keywords" content={keyword} />
        <meta charSet="author" content={author} />
        <title>{title}</title>
      </Helmet>
      {navbar && (
        <Navbar
          links={NAV_LINKS}
          ctaLabel="Visit Store"
          ctaHref="#contact"
          rightExtra={
            state.isAuthenticated ? null :
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
            >
              Login
            </Link>
          }
        />
      )}
      <main>{children}</main>
      {footer && <Footer />}
    </div>
  );
};

Layout.defaultProps = {
  title: "Home - Basit Mobile Zone",
  description: "This is web application where Basit Mobile Zone provided all kinds of mobiles and accessories.",
  keyword: "Basit Mobile Zone",
  author: "Basit Khan",
  navbar: true,
  footer: true,
};

export default Layout;
