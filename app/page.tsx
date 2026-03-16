"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "antd";
import { BookOutlined, CodeOutlined, GlobalOutlined } from "@ant-design/icons";
import styles from "@/styles/page.module.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            <code>app/page.tsx</code>{" "}
            is the landing page for your application, currently being displayed.
          </li>
          <li>
            <code>app/login/page.tsx</code> is the login page for users.
          </li>
          <li>
            <code>app/users/page.tsx</code>{" "}
            is the dashboard that shows an overview of all users, fetched from
            the server.
          </li>
          <li>
            <code>app/users/[id]/page.tsx</code>{" "}
            is a slug page that shows info of a particular user. Since each user
            has its own id, each user has its own infopage, dynamically with the
            use of slugs. Access is regulated via token
          </li>
          <li>
            <code>app/login/new</code>{" "}
            is where the registration form is located.
          </li>
        </ol>

        <div className={styles.ctas}>
          <Button
            type="primary" // as defined in the ConfigProvider in [layout.tsx](./layout.tsx), all primary antd elements are colored #22426b, with buttons #75bd9d as override
            color="blue" // if a single/specific antd component needs yet a different color, it can be explicitly overridden in the component as shown here
            variant="solid" // read more about the antd button and its options here: https://ant.design/components/button
            onClick={() => router.push("/login/new")}
          >
            Register
          </Button>
          <Button
            type="primary"
            variant="solid"
            onClick={() => router.push("/login")}
          >
            Go to login
          </Button>
          <Button
            type="primary"
            variant="solid"
            color="yellow"
            onClick={() => router.push("/users")}
          >
            see all users
          </Button>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
