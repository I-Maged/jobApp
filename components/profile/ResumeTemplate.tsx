import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Profile, Education } from "@/types";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2", fontWeight: 700 },
  ],
});

const degreeLabels: Record<string, string> = {
  associate: "Associate",
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "Ph.D.",
  other: "",
};

function formatDate(ym: string | undefined): string {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  if (!y) return "";
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = parseInt(m ?? "", 10);
  return month >= 1 && month <= 12 ? `${months[month]} ${y}` : y;
}

function formatRange(start: string | undefined, end: string | undefined, current: boolean): string {
  const s = formatDate(start);
  const e = current ? "Present" : formatDate(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} — ${e}`;
}

function formatEducation(ed: Education): string {
  const parts: string[] = [];
  if (ed.highestDegree && ed.highestDegree !== "other" && ed.highestDegree !== "high_school") {
    parts.push(degreeLabels[ed.highestDegree] || ed.highestDegree);
  }
  if (ed.fieldOfStudy) parts.push(ed.fieldOfStudy);
  const detail = parts.join(" in ");
  let line = detail;
  if (ed.institutionName) line = line ? `${line} ~ ${ed.institutionName}` : ed.institutionName;
  if (ed.graduationYear) line = line ? `${line}, ${ed.graduationYear}` : ed.graduationYear;
  return line;
}

const colors = {
  primary: "#1a1a1a",
  secondary: "#4a4a4a",
  accent: "#2b6cb0",
  muted: "#6b7280",
  line: "#e5e7eb",
};

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Inter", fontSize: 11, color: colors.primary, lineHeight: 1.5 },
  header: { marginBottom: 8, textAlign: "center" },
  name: { fontSize: 22, fontFamily: "Inter", fontWeight: 700, color: colors.primary },
  contact: { fontSize: 9, color: colors.secondary, marginTop: 4, flexDirection: "row", justifyContent: "center", gap: 12 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 10 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, marginTop: 12 },
  summary: { fontSize: 10.5, color: colors.primary, marginBottom: 4 },
  roleHeader: { flexDirection: "row", justifyContent: "flex-start", marginTop: 10 },
  roleTitle: { fontSize: 11, fontFamily: "Inter", fontWeight: 700 },
  roleCompany: { fontSize: 11, fontFamily: "Inter", fontWeight: 400, color: colors.secondary, marginLeft: 4 },
  roleDates: { fontSize: 9, color: colors.muted, marginBottom: 3 },
  bullet: { fontSize: 10, color: colors.primary, marginLeft: 12, marginBottom: 2, textIndent: -8 },
  skillChip: { fontSize: 9, paddingHorizontal: 6, backgroundColor: "#f3f4f6", paddingVertical: 2 },
  educationLine: { fontSize: 10.5, color: colors.primary },
});

type Props = {
  profile: Profile;
  summary: string;
  experience: Array<{ company: string; title: string; startDate: string; endDate: string; current: boolean; bullets: string[] }>;
  resumeSkills: string[];
};

export function ResumeTemplate({ profile, summary, experience, resumeSkills }: Props) {
  const contactParts = [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedinUrl,
    profile.portfolioUrl,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName || "Your Name"}</Text>
          {contactParts.length > 0 && (
            <View style={styles.contact}>
              {contactParts.map((part, i) => (
                <Text key={i}>{part}</Text>
              ))}
            </View>
          )}
        </View>

        {summary && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{summary}</Text>
          </>
        )}

        {experience.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {experience.map((role, i) => (
              <View key={i}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleTitle}>{role.title || profile.currentTitle}</Text>
                  {role.company ? <Text style={styles.roleCompany}> | {role.company}</Text> : null}
                </View>
                <Text style={styles.roleDates}>
                  {formatRange(role.startDate, role.current ? undefined : role.endDate, role.current)}
                </Text>
                {role.bullets.map((bullet, j) => (
                  <Text key={j} style={styles.bullet}>` {bullet}</Text>
                ))}
              </View>
            ))}
          </>
        )}

        {resumeSkills.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {resumeSkills.map((skill, i) => (
                <Text key={i} style={styles.skillChip}>{skill}</Text>
              ))}
            </View>
          </>
        )}

        {(profile.education.highestDegree || profile.education.institutionName) && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.educationLine}>{formatEducation(profile.education)}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}