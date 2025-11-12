// Command parser with pipeline support

#[derive(Debug, Clone)]
pub struct Command {
    pub name: String,
    pub args: Vec<String>,
    pub stdin_redirect: Option<String>,
    pub stdout_redirect: Option<(String, bool)>, // (file, append)
    pub stderr_redirect: Option<String>,
}

#[derive(Debug)]
pub struct Pipeline {
    pub commands: Vec<Command>,
}

impl Command {
    pub fn new(name: String, args: Vec<String>) -> Self {
        Self {
            name,
            args,
            stdin_redirect: None,
            stdout_redirect: None,
            stderr_redirect: None,
        }
    }
}

/// Parse a command line into a pipeline
pub fn parse(line: &str) -> Option<Pipeline> {
    if line.trim().is_empty() {
        return None;
    }

    // Split by pipe
    let pipe_parts: Vec<&str> = line.split('|').collect();
    let mut commands = Vec::new();

    for part in pipe_parts {
        if let Some(cmd) = parse_single_command(part.trim()) {
            commands.push(cmd);
        }
    }

    if commands.is_empty() {
        None
    } else {
        Some(Pipeline { commands })
    }
}

/// Parse a single command with redirections
fn parse_single_command(line: &str) -> Option<Command> {
    let mut parts = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    // Simple tokenizer
    while let Some(ch) = chars.next() {
        match ch {
            '"' | '\'' => {
                in_quotes = !in_quotes;
            }
            ' ' | '\t' if !in_quotes => {
                if !current.is_empty() {
                    parts.push(current.clone());
                    current.clear();
                }
            }
            _ => {
                current.push(ch);
            }
        }
    }

    if !current.is_empty() {
        parts.push(current);
    }

    if parts.is_empty() {
        return None;
    }

    let mut cmd = Command::new(parts[0].clone(), Vec::new());
    let mut i = 1;

    while i < parts.len() {
        match parts[i].as_str() {
            "<" => {
                // Input redirection
                if i + 1 < parts.len() {
                    cmd.stdin_redirect = Some(parts[i + 1].clone());
                    i += 2;
                } else {
                    i += 1;
                }
            }
            ">" => {
                // Output redirection (overwrite)
                if i + 1 < parts.len() {
                    cmd.stdout_redirect = Some((parts[i + 1].clone(), false));
                    i += 2;
                } else {
                    i += 1;
                }
            }
            ">>" => {
                // Output redirection (append)
                if i + 1 < parts.len() {
                    cmd.stdout_redirect = Some((parts[i + 1].clone(), true));
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "2>" => {
                // Error redirection
                if i + 1 < parts.len() {
                    cmd.stderr_redirect = Some(parts[i + 1].clone());
                    i += 2;
                } else {
                    i += 1;
                }
            }
            _ => {
                cmd.args.push(parts[i].clone());
                i += 1;
            }
        }
    }

    Some(cmd)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_command() {
        let pipeline = parse("ls -la").unwrap();
        assert_eq!(pipeline.commands.len(), 1);
        assert_eq!(pipeline.commands[0].name, "ls");
        assert_eq!(pipeline.commands[0].args, vec!["-la"]);
    }

    #[test]
    fn test_pipeline() {
        let pipeline = parse("ls -la | grep test").unwrap();
        assert_eq!(pipeline.commands.len(), 2);
        assert_eq!(pipeline.commands[0].name, "ls");
        assert_eq!(pipeline.commands[1].name, "grep");
    }

    #[test]
    fn test_output_redirect() {
        let pipeline = parse("echo hello > file.txt").unwrap();
        assert_eq!(pipeline.commands.len(), 1);
        assert_eq!(pipeline.commands[0].stdout_redirect, Some(("file.txt".to_string(), false)));
    }

    #[test]
    fn test_append_redirect() {
        let pipeline = parse("echo hello >> file.txt").unwrap();
        assert_eq!(pipeline.commands.len(), 1);
        assert_eq!(pipeline.commands[0].stdout_redirect, Some(("file.txt".to_string(), true)));
    }

    #[test]
    fn test_input_redirect() {
        let pipeline = parse("cat < input.txt").unwrap();
        assert_eq!(pipeline.commands.len(), 1);
        assert_eq!(pipeline.commands[0].stdin_redirect, Some("input.txt".to_string()));
    }
}
