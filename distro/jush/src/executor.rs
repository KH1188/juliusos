// Command executor
// TODO: Implement pipelines, redirections, job control

use std::process::Command;
use anyhow::Result;

pub fn execute(cmd: &str, args: &[String]) -> Result<()> {
    let output = Command::new(cmd)
        .args(args)
        .output()?;

    if !output.stdout.is_empty() {
        print!("{}", String::from_utf8_lossy(&output.stdout));
    }

    if !output.stderr.is_empty() {
        eprint!("{}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}
