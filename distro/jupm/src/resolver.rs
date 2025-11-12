use anyhow::{Result, Context, bail};
use std::collections::{HashMap, HashSet, VecDeque};

/// Dependency resolver for packages
pub struct DependencyResolver {
    /// Map of package name to its dependencies
    dependencies: HashMap<String, Vec<String>>,
}

impl DependencyResolver {
    pub fn new() -> Self {
        Self {
            dependencies: HashMap::new(),
        }
    }

    /// Add a package with its dependencies
    pub fn add_package(&mut self, name: String, deps: Vec<String>) {
        self.dependencies.insert(name, deps);
    }

    /// Resolve dependencies for a package in topological order
    /// Returns packages in installation order (dependencies first)
    pub fn resolve(&self, package: &str) -> Result<Vec<String>> {
        let mut result = Vec::new();
        let mut visited = HashSet::new();
        let mut visiting = HashSet::new();

        self.visit(package, &mut result, &mut visited, &mut visiting)?;

        Ok(result)
    }

    /// Resolve dependencies for multiple packages
    pub fn resolve_many(&self, packages: &[String]) -> Result<Vec<String>> {
        let mut result = Vec::new();
        let mut visited = HashSet::new();
        let mut visiting = HashSet::new();

        for package in packages {
            self.visit(package, &mut result, &mut visited, &mut visiting)?;
        }

        // Remove duplicates while preserving order
        let mut seen = HashSet::new();
        result.retain(|x| seen.insert(x.clone()));

        Ok(result)
    }

    /// Depth-first search with cycle detection
    fn visit(
        &self,
        package: &str,
        result: &mut Vec<String>,
        visited: &mut HashSet<String>,
        visiting: &mut HashSet<String>,
    ) -> Result<()> {
        // Already processed
        if visited.contains(package) {
            return Ok(());
        }

        // Cycle detection
        if visiting.contains(package) {
            bail!("Circular dependency detected: {}", package);
        }

        visiting.insert(package.to_string());

        // Visit dependencies first
        if let Some(deps) = self.dependencies.get(package) {
            for dep in deps {
                self.visit(dep, result, visited, visiting)?;
            }
        }

        visiting.remove(package);
        visited.insert(package.to_string());
        result.push(package.to_string());

        Ok(())
    }

    /// Check if there are any circular dependencies
    pub fn check_cycles(&self) -> Result<()> {
        for package in self.dependencies.keys() {
            let mut visited = HashSet::new();
            let mut visiting = HashSet::new();
            let mut dummy = Vec::new();

            self.visit(package, &mut dummy, &mut visited, &mut visiting)?;
        }

        Ok(())
    }

    /// Get direct dependencies of a package
    pub fn get_dependencies(&self, package: &str) -> Option<&Vec<String>> {
        self.dependencies.get(package)
    }

    /// Get all packages that depend on a given package (reverse dependencies)
    pub fn get_reverse_dependencies(&self, package: &str) -> Vec<String> {
        self.dependencies
            .iter()
            .filter_map(|(name, deps)| {
                if deps.contains(&package.to_string()) {
                    Some(name.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Find packages that can be safely removed (no other packages depend on them)
    pub fn find_orphans(&self, installed: &HashSet<String>) -> Vec<String> {
        installed
            .iter()
            .filter(|pkg| {
                let reverse_deps = self.get_reverse_dependencies(pkg);
                // Check if any reverse deps are still installed
                !reverse_deps.iter().any(|dep| installed.contains(dep))
            })
            .cloned()
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_dependency() {
        let mut resolver = DependencyResolver::new();
        resolver.add_package("a".to_string(), vec!["b".to_string()]);
        resolver.add_package("b".to_string(), vec![]);

        let order = resolver.resolve("a").unwrap();
        assert_eq!(order, vec!["b", "a"]);
    }

    #[test]
    fn test_chain_dependency() {
        let mut resolver = DependencyResolver::new();
        resolver.add_package("a".to_string(), vec!["b".to_string()]);
        resolver.add_package("b".to_string(), vec!["c".to_string()]);
        resolver.add_package("c".to_string(), vec![]);

        let order = resolver.resolve("a").unwrap();
        assert_eq!(order, vec!["c", "b", "a"]);
    }

    #[test]
    fn test_diamond_dependency() {
        let mut resolver = DependencyResolver::new();
        resolver.add_package("a".to_string(), vec!["b".to_string(), "c".to_string()]);
        resolver.add_package("b".to_string(), vec!["d".to_string()]);
        resolver.add_package("c".to_string(), vec!["d".to_string()]);
        resolver.add_package("d".to_string(), vec![]);

        let order = resolver.resolve("a").unwrap();
        // d must come before b and c, and b/c must come before a
        assert!(order.iter().position(|x| x == "d") < order.iter().position(|x| x == "b"));
        assert!(order.iter().position(|x| x == "d") < order.iter().position(|x| x == "c"));
        assert!(order.iter().position(|x| x == "b") < order.iter().position(|x| x == "a"));
        assert!(order.iter().position(|x| x == "c") < order.iter().position(|x| x == "a"));
    }

    #[test]
    fn test_circular_dependency() {
        let mut resolver = DependencyResolver::new();
        resolver.add_package("a".to_string(), vec!["b".to_string()]);
        resolver.add_package("b".to_string(), vec!["a".to_string()]);

        let result = resolver.resolve("a");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Circular dependency"));
    }

    #[test]
    fn test_reverse_dependencies() {
        let mut resolver = DependencyResolver::new();
        resolver.add_package("a".to_string(), vec!["b".to_string()]);
        resolver.add_package("c".to_string(), vec!["b".to_string()]);
        resolver.add_package("b".to_string(), vec![]);

        let reverse = resolver.get_reverse_dependencies("b");
        assert_eq!(reverse.len(), 2);
        assert!(reverse.contains(&"a".to_string()));
        assert!(reverse.contains(&"c".to_string()));
    }
}
