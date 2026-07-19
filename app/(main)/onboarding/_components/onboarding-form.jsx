"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/site/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { onboardingSchema } from "@/lib/schemas";
import { updateUser } from "@/actions/user";

const OnboardingForm = ({ industries }) => {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const {
    loading: updateLoading,
    fn: updateUserFn,
    data: updateResult,
  } = useFetch(updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (values) => {
    try {
      const formattedIndustry = `${values.industry}-${values.subIndustry
        .toLowerCase()
        .replace(/ /g, "-")}`;

      await updateUserFn({
        ...values,
        industry: formattedIndustry,
      });
    } catch (error) {
      console.error("Onboarding error:", error);
    }
  };

  useEffect(() => {
    if (updateResult?.success && !updateLoading) {
      toast.success("Profile completed successfully!");
      router.push("/dashboard");
      router.refresh();
    }
  }, [updateResult, updateLoading]);

  const watchIndustry = watch("industry");

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-stretch">
      {/* Brand / value panel */}
      <div className="border-gradient relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between">
        <div
          className="aurora-blob"
          style={{ width: 280, height: 280, top: -80, right: -60, background: "hsl(var(--purple))", opacity: 0.25 }}
          aria-hidden="true"
        />
        <div
          className="aurora-blob"
          style={{ width: 220, height: 220, bottom: -90, left: -40, background: "hsl(var(--cyan))", opacity: 0.2 }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <Logo href={null} markSize={40} />
          <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to <span className="aurora-text animate-aurora">NovaNest</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Tell us about your career so we can tailor resumes, interviews, and
            insights to the work you actually do.
          </p>
        </div>
        <ul className="relative z-10 mt-10 space-y-4">
          {[
            "Personalized AI resume & cover letter generation",
            "Role-specific interview practice with live scoring",
            "Live industry insights for your exact field",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-foreground/85">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-aurora">
                <Check className="h-3 w-3 text-white" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="relative z-10 mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Takes about 60 seconds
        </div>
      </div>

      {/* Form panel */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="gradient-title text-3xl md:text-4xl">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Select your industry to get personalized career insights and
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                onValueChange={(value) => {
                  setValue("industry", value);
                  setSelectedIndustry(
                    industries.find((ind) => ind.id === value)
                  );
                  setValue("subIndustry", "");
                }}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Industries</SelectLabel>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-destructive">
                  {errors.industry.message}
                </p>
              )}
            </div>

            {watchIndustry && (
              <div className="space-y-2">
                <Label htmlFor="subIndustry">Specialization</Label>
                <Select
                  onValueChange={(value) => setValue("subIndustry", value)}
                >
                  <SelectTrigger id="subIndustry">
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Specializations</SelectLabel>
                      {selectedIndustry?.subIndustries.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.subIndustry && (
                  <p className="text-sm text-destructive">
                    {errors.subIndustry.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                placeholder="Enter years of experience"
                {...register("experience")}
              />
              {errors.experience && (
                <p className="text-sm text-destructive">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                placeholder="e.g., Python, JavaScript, Project Management"
                {...register("skills")}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple skills with commas
              </p>
              {errors.skills && (
                <p className="text-sm text-destructive">{errors.skills.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your professional background..."
                className="h-32"
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>

            <Button type="submit" variant="gradient" className="w-full gap-2" disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingForm;
