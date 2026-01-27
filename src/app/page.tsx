import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

const SectionTitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h2
    className={`font-dashiell-bright font-bold text-3xl text-primary mb-4 pl-4 lg:pl-10 pr-8 ${className}`}
  >
    {children}
  </h2>
);

const Paragraph = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 text-primary font-tenon pl-4 lg:pl-10 pr-8">{children}</p>
);

const ListItem = ({ children }: { children: ReactNode }) => (
  <li className="text-primary font-tenon pl-4 lg:pl-10 pr-8">{children}</li>
);

const HorizontalLine = () => (
  <hr className="border-primary border-2 my-8 w-full" />
);

export default function Page() {
  return (
    <div className="relative rounded-lg flex flex-col lg:flex-col max-w-screen-2xl lg:items-end">
      <div className="lg:w-1/3 z-10 lg:fixed left-0">
        <h1 className="pb-8 pl-12 text-7xl pt-4 sm:pt-0 sm:text-8xl font-bold tracking-tighter text-primary font-tenon-extrabold bg-background">
          Diego <br />
          Glusberg
        </h1>
        <div className="w-full h-auto aspect-w-1 aspect-h-1">
          <Image
            src={'/diego.jpg'}
            width={500}
            height={500}
            alt="Diego Glusberg"
            className="object-cover"
            priority
          />
        </div>
      </div>
      <div className="lg:w-2/3 lg:pt-44 relative z-10">
        <div className="mb-12 mt-10 lg:mt-10 text-primary font-dashiell-bright font-bold text-3xl pl-4 lg:pl-10 pr-8">
          I’m a Full-Stack Engineer specializing in building AI-powered
          Products.
        </div>
        <Paragraph>
          My journey from a fine-dining chef to software developer has been
          unconventional but rewarding, and I&apos;ve brought along excellent
          communication skills and a drive for excellence.
        </Paragraph>
        <Paragraph>
          At Practica, which was acquired by BetterUp in March 2024, I built our{' '}
          <span className="text-accent font-bold font-tenon-bold">
            Coaching Marketplace
          </span>{' '}
          and developed an{' '}
          <span className="text-accent font-bold font-tenon-bold">
            AI Career Coaching App
          </span>
          . My work spanned from prompt engineering to user interface design and
          data model creation.
        </Paragraph>
      </div>
      <HorizontalLine />
      <div className="lg:w-2/3 relative z-10">
        <SectionTitle>What Drives Me</SectionTitle>
        <Paragraph>
          <span className="text-accent font-bold font-tenon-bold">
            Kindness, Collaboration, Efficiency.{' '}
          </span>
          Delivering results under tight deadlines is second nature to me,
          thanks to my time in professional kitchens. I&apos;m passionate about
          using technology to make a real impact on people&apos;s lives.
        </Paragraph>
      </div>
      <HorizontalLine />
      <div className="lg:w-2/3 relative z-10">
        <SectionTitle>Tech Experience</SectionTitle>
        <div className="mt-2 text-accent pl-4 lg:pl-10 pr-8">
          <div className="text-accent font-bold font-tenon-bold">
            Practica (Acquired by BetterUp)
          </div>
          <div>
            <em className="text-primary font-dashiell-bright italic font-semibold">
              Founding Engineer and First Hire, Jan 2021 - March 2024
            </em>
          </div>
          <div className="mt-4 text-accent font-tenon">
            Practica was a tight-knit team of just five people, which meant I
            wore many hats and was involved in every aspect of the product.
          </div>
          <ul className="list-disc list-outside flex flex-col gap-3 mt-14 pl-5">
            <ListItem>
              <Link
                href="https://practicahq.com/learn"
                className="text-primary font-bold underline hover:text-accent"
              >
                AI Career Coaching App
              </Link>
              : Led development from concept to implementation. Architected
              RAG-powered non-linear personalized career growth experience,
              leveraging a third-party NLP API for prompt generation for rapid
              development.
            </ListItem>
            <ListItem>
              <span className="text-accent font-bold font-tenon-bold ">
                Marketplace Platform
              </span>
              : Automated key aspects of a coaching marketplace, including
              coach-client matching, billing, note-taking, curriculum resource
              provision, learning experience management, and email handling.
              Features were owned from concept to implementation and beyond.
            </ListItem>
            <ListItem>
              <span className="text-accent font-bold font-tenon-bold ">
                Tech Stack
              </span>
              : Specializing in NextJS, React, and Node. Integrated vector
              (Pinecone) and relational databases (Postgres). I&apos;ve a proven
              track record of delivering high-quality code and features.
            </ListItem>
            <ListItem>
              <span className="text-accent font-bold font-tenon-bold">
                Strategic Decision-Making
              </span>
              : Contributed to product strategy and roadmap planning. Led
              development of a new product features with a focus on process and
              user experience.
            </ListItem>
          </ul>
        </div>
      </div>
    </div>
  );
}
