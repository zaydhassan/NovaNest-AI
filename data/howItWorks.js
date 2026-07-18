import { UserPlus, FileEdit, Users, LineChart } from "lucide-react";

export const howItWorks = [
  {
    title: "Personal Profile Setup",
    description: "Tell NovaNest about your experience and career goals for tailored advice.",
    icon: <UserPlus className="w-8 h-8 text-primary" />,
  },
  {
    title: "Dynamic Resume Builder",
    description: "Create and customize ATS-friendly resumes effortlessly with AI assistance.",
    icon: <FileEdit className="w-8 h-8 text-primary" />,
  },
  {
    title: "Smart Interview Prep",
    description: "Practice AI-generated interview questions crafted specifically for you.",
    icon: <Users className="w-8 h-8 text-primary" />,
  },
  {
    title: "Track Growth & Success",
    description: "Visualize your career progress and get AI tips for continuous improvement.",
    icon: <LineChart className="w-8 h-8 text-primary" />,
  },
];
