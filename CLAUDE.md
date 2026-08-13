# LowPropTax - Claude Code Configuration

## Project Overview
LowPropTax is a property tax appeals application designed to help homeowners and property managers identify, calculate, and document property tax appeal opportunities using the Sales Comparison Approach methodology.

## Available Community Skills

This project is configured with community-created skills to enhance development and property tax analysis workflows. All skills are cloned and maintained in `~/.claude/community-skills/`.

### Tier 1: Core Skills (Essential)

#### 1. Claude Scientific Skills
**Path**: `~/.claude/community-skills/claude-scientific-skills/`
**Use Cases**:
- Financial calculations for property valuation
- Comparable property analysis
- Adjustment calculations (sales comparison approach)
- Market trend analysis
- Statistical analysis of property data

**Key Commands**:
- `/calculate` - Perform complex financial calculations
- `/analyze-data` - Statistical analysis and comparisons
- `/generate-report` - Create financial analysis reports

---

#### 2. Superpowers (Development Workflow)
**Path**: `~/.claude/community-skills/superpowers/`
**Use Cases**:
- Testing appeal calculation logic
- Code review for validation accuracy
- Documentation of methodology
- Quality assurance workflows
- Debugging property valuation logic

**Key Workflows**:
- Test-driven development for appeal calculations
- Code quality checks
- Documentation generation
- Peer review protocols

---

#### 3. read-only-postgres (Data Access)
**Path**: `~/.claude/community-skills/read-only-postgres/`
**Use Cases**:
- Query comparable property databases
- Access county assessor records
- Retrieve historical sales data
- Analyze property assessment trends
- Generate market data reports

**Configuration Needed**:
- Database connection strings for local/county assessor databases
- Read-only credentials
- Query templates for common property searches

**Example Queries**:
```sql
SELECT * FROM properties WHERE county = 'TARGET_COUNTY' AND year >= 2022
SELECT * FROM sales WHERE property_type = 'residential' AND sale_price > 0
```

---

## Tier 2: Recommended Skills (Integration-Ready)

- **Claude Code Agents** - Multi-stage document review & appeal validation
- **Trail of Bits Security Skills** - Data security for sensitive property/financial information

## Recommended Workflows

### Property Appeal Analysis Workflow
1. Use `read-only-postgres` to gather comparable property data
2. Use `Claude Scientific Skills` to calculate adjustments and valuations
3. Use `Superpowers` testing tools to validate calculations
4. Generate appeal report with supporting documentation

### Development Workflow
1. Write tests using `Superpowers` TDD approach
2. Implement appeal calculation logic
3. Validate with `Claude Scientific Skills` analysis
4. Review code quality with `Superpowers` review tools
5. Deploy with confidence

## Integration Points

### With External Systems
- County assessor databases (via read-only-postgres)
- Property listing APIs (Zillow, Redfin data)
- Market analysis services (Homesage AI, Regrid parcel data)

### With Project Structure
- `/scripts/` - Python/Node scripts for data processing
- `/data/` - Comparable property datasets and analysis
- `/reports/` - Generated appeal documents
- `/validation/` - Test cases and validation rules

## Skill Maintenance

All community skills are version-controlled in `~/.claude/community-skills/`. To update:
```bash
cd ~/.claude/community-skills/<skill-name>
git pull origin main
```

## Next Steps

1. Configure read-only-postgres with local/county databases
2. Review Claude Scientific Skills documentation for available calculation methods
3. Set up validation test suite using Superpowers
4. Begin property analysis workflows

## Additional Resources

- **Awesome Claude Code**: https://github.com/hesreallyhim/awesome-claude-code
- **Claude Scientific Skills Docs**: See `~/.claude/community-skills/claude-scientific-skills/README.md`
- **Superpowers Workflows**: See `~/.claude/community-skills/superpowers/`
