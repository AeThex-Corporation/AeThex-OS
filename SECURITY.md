# Security Policy

## 1. Purpose and Scope

The AeThex ecosystem takes security seriously across all repositories, including
operating systems, tooling, libraries, documentation, and standards.

This policy defines how security vulnerabilities should be reported, assessed,
disclosed, and remediated across AeThex-managed projects.

**Do not disclose security vulnerabilities publicly.**
Public GitHub issues, pull requests, or discussions are not appropriate channels
for reporting security issues.

---

## 2. Organizational Boundaries

AeThex operates through distinct but coordinated entities. Security handling
respects these boundaries:

### AeThex Foundation
- Owns standards, specifications, and certification criteria
- Handles vulnerabilities in **published standards**, reference specs, and audits
- Does **not** deploy production systems

### AeThex Labs
- Owns experimental software, research prototypes, and educational tooling
- Handles vulnerabilities in **non-production** and experimental code
- May deprecate or archive vulnerable experiments rather than patch them

### AeThex Corporation
- Owns production software, infrastructure, and commercial distributions
- Handles vulnerabilities with **operational, customer, or commercial impact**
- Responsible for patch releases, advisories, and mitigations

The appropriate entity will triage the report internally if scope is unclear.

---

## 3. Supported Versions

Security updates are provided only for supported versions listed below.

| Version | Supported |
|-------|-----------|
| 5.1.x | ✅ Yes |
| 5.0.x | ❌ No |
| 4.0.x | ✅ Yes |
| < 4.0 | ❌ No |

If you are using an unsupported version, upgrade before reporting unless the
issue demonstrates systemic risk.

---

## 4. Reporting a Vulnerability

### Primary Reporting Channel

**Email:** `security@aethex.foundation`  
**Subject:** `Security Vulnerability Report – <repository name>`

If email is not feasible, GitHub **Private Vulnerability Reporting** may be used
where enabled.

### Encryption

PGP-encrypted submissions are encouraged when practical.
(See PGP section below.)

---

## 5. What to Include

Please provide as much of the following as possible:

- Clear description of the vulnerability
- Affected repository, component, and versions
- Steps to reproduce (proof-of-concept preferred)
- Impact assessment (confidentiality, integrity, availability)
- Environment details (OS, architecture, configuration)
- Any relevant logs, traces, or artifacts

Incomplete reports may delay triage.

---

## 6. Severity Assessment (CVSS)

AeThex uses **CVSS v3.1** as a baseline for severity classification:

- **Critical (9.0–10.0):** Immediate action, coordinated fix
- **High (7.0–8.9):** Expedited remediation
- **Medium (4.0–6.9):** Scheduled fix
- **Low (0.1–3.9):** May be deferred or documented only

Final severity is determined internally and may differ from reporter estimates.

---

## 7. Response Timeline

You can expect the following process:

- **Acknowledgement:** within 72 hours
- **Initial triage:** within 5 business days
- **Status updates:** at least every 7 days while open

Complex issues or multi-repository impact may extend timelines.

---

## 8. Disclosure Policy

AeThex follows a **coordinated disclosure model**:

- Accepted vulnerabilities are patched or mitigated before public disclosure
- Reporters will be notified prior to public advisories when feasible
- Declined reports will receive a brief explanation
- Public disclosure without coordination may affect future participation

---

## 9. Bug Bounty (Discretionary)

AeThex **may**, at its discretion:

- Acknowledge reporters in advisories or release notes
- Provide monetary or non-monetary rewards for high-impact findings

There is **no guaranteed bounty**, and participation does not create any legal
or contractual obligation.

---

## 10. Security Best Practices

Contributors and users are expected to:

- Avoid committing secrets or credentials
- Use least-privilege principles
- Keep dependencies updated
- Treat security-sensitive changes with heightened review

Repositories may enforce additional controls.

---

## 11. Safe Harbor

Security research conducted in good faith, without data exfiltration,
service disruption, or privacy violation, will not be considered a violation
of AeThex policy.

---

## 12. PGP Key

For encrypted communication, use the following PGP key:

