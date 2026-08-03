"use client";

import { useEffect, useState, useTransition } from "react";
import { saveProfile } from "@/actions/profile";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { ExtractedProfile } from "@/lib/profile-extract";
import type {
  ExperienceLevel,
  HighestDegree,
  ProfileFormState,
  RemotePreference,
  WorkAuthorization,
  WorkExperienceRole,
} from "@/types";

type Props = {
  initialEmail: string;
  initial: ProfileFormState;
  hasResume: boolean;
};

const MAX_WORK_ROLES = 3;

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ExtractStatus = "idle" | "extracting" | "error";

function generateRoleId(): string {
  return `role-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function ProfileForm({ initialEmail, initial, hasResume }: Props) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [location, setLocation] = useState(initial.location);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl);
  const [workAuthorization, setWorkAuthorization] = useState<WorkAuthorization>(
    initial.workAuthorization,
  );

  const [currentTitle, setCurrentTitle] = useState(initial.currentTitle);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(
    initial.experienceLevel,
  );
  const [yearsExperience, setYearsExperience] = useState(initial.yearsExperience);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(csvToArr(initial.skillsCsv));
  const [industryInput, setIndustryInput] = useState("");
  const [industries, setIndustries] = useState<string[]>(
    csvToArr(initial.industriesCsv),
  );

  const [roles, setRoles] = useState<WorkExperienceRole[]>(
    initial.workExperience.length > 0 ? initial.workExperience : [],
  );

  const [highestDegree, setHighestDegree] = useState<HighestDegree | "">(
    initial.highestDegree,
  );
  const [fieldOfStudy, setFieldOfStudy] = useState(initial.fieldOfStudy);
  const [institutionName, setInstitutionName] = useState(initial.institutionName);
  const [graduationYear, setGraduationYear] = useState(initial.graduationYear);

  const [titlesSeeking, setTitlesSeeking] = useState(initial.jobTitlesSeekingCsv);
  const [remotePreference, setRemotePreference] = useState<RemotePreference>(
    initial.remotePreference,
  );
  const [salaryExpectation, setSalaryExpectation] = useState(
    initial.salaryExpectation,
  );
  const [preferredLocations, setPreferredLocations] = useState(
    initial.preferredLocationsCsv,
  );

  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [extractPending, startExtractTransition] = useTransition();
  const [extractStatus, setExtractStatus] = useState<ExtractStatus>("idle");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedFields, setExtractedFields] = useState<string[] | null>(null);

  useEffect(() => {
    if (status !== "saved") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 4000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (extractStatus !== "extracting") return;
    const timeout = window.setTimeout(() => setExtractStatus("idle"), 6000);
    return () => window.clearTimeout(timeout);
  }, [extractStatus]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addIndustry = () => {
    const trimmed = industryInput.trim();
    if (!trimmed || industries.includes(trimmed)) return;
    setIndustries([...industries, trimmed]);
    setIndustryInput("");
  };

  const removeIndustry = (industry: string) => {
    setIndustries(industries.filter((i) => i !== industry));
  };

  const addRole = () => {
    if (roles.length >= MAX_WORK_ROLES) return;
    setRoles([
      ...roles,
      {
        id: generateRoleId(),
        company: "",
        title: "",
        startDate: "",
        endDate: "",
        current: false,
        accomplishments: "",
      },
    ]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, patch: Partial<WorkExperienceRole>) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleExtract = () => {
    setExtractError(null);
    setExtractedFields(null);
    setExtractStatus("extracting");
    startExtractTransition(async () => {
      try {
        const res = await fetch("/api/resume/extract", { method: "POST" });
        const json = (await res.json()) as {
          success: boolean;
          error?: string;
          profile?: ExtractedProfile;
        };
        if (!res.ok || !json.success) {
          setExtractStatus("error");
          setExtractError(json.error ?? "Extraction failed");
          return;
        }
        const p = json.profile ?? {};
        if (typeof p.fullName === "string" && p.fullName) setFullName(p.fullName);
        if (typeof p.phone === "string" && p.phone) setPhone(p.phone);
        if (typeof p.location === "string" && p.location) setLocation(p.location);
        if (typeof p.linkedinUrl === "string" && p.linkedinUrl)
          setLinkedinUrl(p.linkedinUrl);
        if (typeof p.portfolioUrl === "string" && p.portfolioUrl)
          setPortfolioUrl(p.portfolioUrl);
        if (p.workAuthorization) setWorkAuthorization(p.workAuthorization);
        if (typeof p.currentTitle === "string" && p.currentTitle)
          setCurrentTitle(p.currentTitle);
        if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
        if (typeof p.yearsExperience === "string" && p.yearsExperience)
          setYearsExperience(p.yearsExperience);
        if (typeof p.skillsCsv === "string" && p.skillsCsv)
          setSkills(csvToArr(p.skillsCsv));
        if (typeof p.industriesCsv === "string" && p.industriesCsv)
          setIndustries(csvToArr(p.industriesCsv));
        if (Array.isArray(p.workExperience) && p.workExperience.length > 0)
          setRoles(p.workExperience);
        if (p.highestDegree) setHighestDegree(p.highestDegree);
        if (typeof p.fieldOfStudy === "string" && p.fieldOfStudy)
          setFieldOfStudy(p.fieldOfStudy);
        if (typeof p.institutionName === "string" && p.institutionName)
          setInstitutionName(p.institutionName);
        if (typeof p.graduationYear === "string" && p.graduationYear)
          setGraduationYear(p.graduationYear);
        if (typeof p.jobTitlesSeekingCsv === "string" &&
          p.jobTitlesSeekingCsv)
          setTitlesSeeking(p.jobTitlesSeekingCsv);
        if (p.remotePreference) setRemotePreference(p.remotePreference);
        if (typeof p.salaryExpectation === "string" && p.salaryExpectation)
          setSalaryExpectation(p.salaryExpectation);
        if (typeof p.preferredLocationsCsv === "string" &&
          p.preferredLocationsCsv)
          setPreferredLocations(p.preferredLocationsCsv);
        setExtractedFields(Object.keys(p));
        setStatus("idle");
      } catch (err) {
        console.error("[components/profile/ProfileForm] extract", err);
        setExtractStatus("error");
        setExtractError("Extraction failed. Please try again.");
      }
    });
  };

  const handleSave = () => {
    setErrorMessage(null);
    setStatus("saving");
    startTransition(async () => {
      const result = await saveProfile({
        fullName,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        workAuthorization,
        currentTitle,
        experienceLevel,
        yearsExperience,
        skillsCsv: skills.join(", "),
        industriesCsv: industries.join(", "),
        workExperience: roles,
        highestDegree,
        fieldOfStudy,
        institutionName,
        graduationYear,
        jobTitlesSeekingCsv: titlesSeeking,
        remotePreference,
        salaryExpectation,
        preferredLocationsCsv: preferredLocations,
      });
      if (result.success) {
        setStatus("saved");
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Failed to save profile");
      }
    });
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <SectionCard title="Personal Info" description="Basic details about you.">
        <Field label="Full Name" htmlFor="full_name">
          <input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email" hint="Pre-filled from your auth account, not editable">
          <input
            id="email"
            value={initialEmail}
            disabled
            className={`${inputClass} cursor-not-allowed bg-surface-secondary text-text-secondary`}
          />
        </Field>
        <Field label="Phone Number" htmlFor="phone">
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputClass}
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className={inputClass}
          />
        </Field>
        <Field label="LinkedIn URL" htmlFor="linkedin">
          <input
            id="linkedin"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/your-handle"
            className={inputClass}
          />
        </Field>
        <Field label="Portfolio / GitHub" htmlFor="portfolio">
          <input
            id="portfolio"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://github.com/your-handle"
            className={inputClass}
          />
        </Field>
        <Field label="Work Authorization" htmlFor="work_authorization">
          <select
            id="work_authorization"
            value={workAuthorization}
            onChange={(e) => setWorkAuthorization(e.target.value as WorkAuthorization)}
            className={inputClass}
          >
            <option value="citizen">Citizen</option>
            <option value="permanent_resident">Permanent Resident</option>
            <option value="visa_required">Visa Required</option>
          </select>
        </Field>
      </SectionCard>

      <SectionCard title="Professional Info" description="Your current role and core skills.">
        <Field label="Current / Recent Job Title" htmlFor="current_title">
          <input
            id="current_title"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="Frontend Engineer"
            className={inputClass}
          />
        </Field>
        <Field label="Experience Level" htmlFor="experience_level">
          <select
            id="experience_level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | "")}
            className={inputClass}
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </Field>
        <Field label="Years of Experience" htmlFor="years_experience">
          <input
            id="years_experience"
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="3"
            className={inputClass}
          />
        </Field>
        <TagInputField
          label="Skills"
          htmlFor="skill_input"
          placeholder="E.g. React"
          value={skillInput}
          onChange={setSkillInput}
          tags={skills}
          onAdd={addSkill}
          onRemove={removeSkill}
          accentClass="bg-accent-muted text-accent"
        />
        <TagInputField
          label="Industries Worked In"
          htmlFor="industry_input"
          placeholder="E.g. FinTech, Healthcare"
          value={industryInput}
          onChange={setIndustryInput}
          tags={industries}
          onAdd={addIndustry}
          onRemove={removeIndustry}
          accentClass="bg-info-lightest text-info-foreground"
          optional
        />
      </SectionCard>

      <SectionCard
        title="Work Experience"
        description="Up to three roles. Add the ones most relevant to your next move."
        action={
          <button
            type="button"
            onClick={addRole}
            disabled={roles.length >= MAX_WORK_ROLES}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            Add role
          </button>
        }
      >
        {roles.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-light bg-surface-secondary px-4 py-6 text-center text-sm text-text-muted">
            No work experience added yet. Click &ldquo;Add role&rdquo; to record one.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {roles.map((role, index) => (
              <WorkRoleCard
                key={role.id}
                role={role}
                index={index}
                canRemove={roles.length > 1}
                onChange={(patch) => updateRole(role.id, patch)}
                onRemove={() => removeRole(role.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Education" description="Your highest degree or current program.">
        <Field label="Highest Degree" htmlFor="highest_degree">
          <select
            id="highest_degree"
            value={highestDegree}
            onChange={(e) => setHighestDegree(e.target.value as HighestDegree | "")}
            className={inputClass}
          >
            <option value="high_school">High School</option>
            <option value="associate">Associate</option>
            <option value="bachelor">Bachelor</option>
            <option value="master">Master</option>
            <option value="phd">PhD</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Field of Study" htmlFor="field_of_study">
          <input
            id="field_of_study"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            placeholder="Computer Science"
            className={inputClass}
          />
        </Field>
        <Field label="Institution Name" htmlFor="institution_name">
          <input
            id="institution_name"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            placeholder="E.g. State University"
            className={inputClass}
          />
        </Field>
        <Field label="Graduation Year" htmlFor="graduation_year">
          <input
            id="graduation_year"
            type="number"
            min={1950}
            max={2100}
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            placeholder="YYYY"
            className={inputClass}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Job Preferences" description="Where and how you want to work next.">
        <Field label="Job Titles Seeking" htmlFor="titles_seeking">
          <input
            id="titles_seeking"
            value={titlesSeeking}
            onChange={(e) => setTitlesSeeking(e.target.value)}
            placeholder="Frontend Engineer, React Developer"
            className={inputClass}
          />
        </Field>
        <Field label="Remote Preference" htmlFor="remote_preference">
          <select
            id="remote_preference"
            value={remotePreference}
            onChange={(e) => setRemotePreference(e.target.value as RemotePreference)}
            className={inputClass}
          >
            <option value="remote">Remote</option>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="any">Any</option>
          </select>
        </Field>
        <Field label="Salary Expectation" htmlFor="salary_expectation" optional>
          <input
            id="salary_expectation"
            value={salaryExpectation}
            onChange={(e) => setSalaryExpectation(e.target.value)}
            placeholder="E.g. $120k+"
            className={inputClass}
          />
        </Field>
        <Field label="Preferred Locations" htmlFor="preferred_locations" optional>
          <input
            id="preferred_locations"
            value={preferredLocations}
            onChange={(e) => setPreferredLocations(e.target.value)}
            placeholder="E.g. New York, London"
            className={inputClass}
          />
        </Field>
      </SectionCard>

      <div className="flex flex-col gap-3">
        {status === "saved" ? (
          <div
            role="status"
            className="rounded-md border border-success-lightest bg-success-lightest px-4 py-2.5 text-sm font-medium text-success-foreground"
          >
            Profile saved successfully.
          </div>
        ) : null}
        {status === "error" && errorMessage ? (
          <ErrorBanner>{errorMessage}</ErrorBanner>
        ) : null}
        {extractStatus === "error" && extractError ? (
          <ErrorBanner>{extractError}</ErrorBanner>
        ) : null}
        {extractStatus === "idle" && extractedFields ? (
          <div
            role="status"
            className="rounded-md border border-success bg-surface px-4 py-2.5 text-sm font-medium text-success"
          >
            Extracted {extractedFields.length} field
            {extractedFields.length === 1 ? "" : "s"} from your resume — review
            and click Save Profile.
          </div>
        ) : null}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasResume ? (
            <button
              type="button"
              onClick={handleExtract}
              disabled={extractPending}
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {extractPending ? "Extracting…" : "Extract from Resume"}
            </button>
          ) : (
            <span className="text-xs text-text-muted">Upload a resume above to enable extraction.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </form>
  );
}

function csvToArr(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const inputClass =
  "block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold leading-6 text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        {optional ? <span className="text-xs text-text-muted">Optional</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}

function TagInputField({
  label,
  htmlFor,
  placeholder,
  value,
  onChange,
  tags,
  onAdd,
  onRemove,
  accentClass,
  optional,
}: {
  label: string;
  htmlFor: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  tags: string[];
  onAdd: () => void;
  onRemove: (tag: string) => void;
  accentClass: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        {optional ? <span className="text-xs text-text-muted">Optional</span> : null}
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${accentClass}`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                  aria-label={`Remove ${tag}`}
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            id={htmlFor}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
            placeholder={placeholder}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkRoleCard({
  role,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  role: WorkExperienceRole;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<WorkExperienceRole>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Role {index + 1}
        </span>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-text-secondary hover:text-error"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <Field label="Company Name" htmlFor={`${role.id}-company`}>
          <input
            id={`${role.id}-company`}
            value={role.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Acme Inc."
            className={inputClass}
          />
        </Field>
        <Field label="Job Title" htmlFor={`${role.id}-title`}>
          <input
            id={`${role.id}-title`}
            value={role.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Frontend Engineer"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Start Date" htmlFor={`${role.id}-start`}>
            <input
              id={`${role.id}-start`}
              type="month"
              value={role.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="End Date" htmlFor={`${role.id}-end`} hint="Leave blank if still working here">
            <input
              id={`${role.id}-end`}
              type="month"
              value={role.endDate}
              disabled={role.current}
              onChange={(e) => onChange({ endDate: e.target.value })}
              placeholder="YYYY-MM"
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted`}
            />
          </Field>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={role.current}
            onChange={(e) =>
              onChange({
                current: e.target.checked,
                endDate: e.target.checked ? "" : role.endDate,
              })
            }
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
          />
          Currently working here
        </label>
        <Field label="Key Accomplishments" htmlFor={`${role.id}-accomplishments`}>
          <textarea
            id={`${role.id}-accomplishments`}
            value={role.accomplishments}
            onChange={(e) => onChange({ accomplishments: e.target.value })}
            rows={4}
            placeholder="Describe what you owned and shipped in this role."
            className={`${inputClass} resize-y`}
          />
        </Field>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
