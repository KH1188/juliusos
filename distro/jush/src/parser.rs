// Command parser
// TODO: Implement proper shell parsing (tokenization, quoting, etc.)

pub struct Command {
    pub name: String,
    pub args: Vec<String>,
}

pub fn parse(line: &str) -> Option<Command> {
    let parts: Vec<&str> = line.split_whitespace().collect();

    if parts.is_empty() {
        return None;
    }

    Some(Command {
        name: parts[0].to_string(),
        args: parts[1..].iter().map(|s| s.to_string()).collect(),
    })
}
