// Command executor with pipeline and redirection support

use std::process::{Command, Stdio};
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write};
use anyhow::{Result, Context};
use crate::parser::Pipeline;

/// Execute a pipeline of commands
pub fn execute_pipeline(pipeline: &Pipeline) -> Result<()> {
    if pipeline.commands.is_empty() {
        return Ok(());
    }

    if pipeline.commands.len() == 1 {
        // Single command - simpler execution
        return execute_single(&pipeline.commands[0]);
    }

    // Multiple commands - set up pipes
    let mut prev_stdout: Option<std::process::ChildStdout> = None;

    for (i, cmd) in pipeline.commands.iter().enumerate() {
        let is_last = i == pipeline.commands.len() - 1;

        let mut command = Command::new(&cmd.name);
        command.args(&cmd.args);

        // Handle stdin
        if let Some(prev) = prev_stdout.take() {
            command.stdin(Stdio::from(prev));
        } else if let Some(ref file) = cmd.stdin_redirect {
            let f = File::open(file).context(format!("Failed to open input file: {}", file))?;
            command.stdin(Stdio::from(f));
        } else {
            command.stdin(Stdio::inherit());
        }

        // Handle stdout
        if is_last {
            // Last command in pipeline
            if let Some((ref file, append)) = cmd.stdout_redirect {
                let f = if append {
                    OpenOptions::new().create(true).append(true).open(file)?
                } else {
                    File::create(file)?
                };
                command.stdout(Stdio::from(f));
            } else {
                command.stdout(Stdio::inherit());
            }
        } else {
            // Intermediate command - pipe to next
            command.stdout(Stdio::piped());
        }

        // Handle stderr
        if let Some(ref file) = cmd.stderr_redirect {
            let f = File::create(file).context(format!("Failed to create error file: {}", file))?;
            command.stderr(Stdio::from(f));
        } else {
            command.stderr(Stdio::inherit());
        }

        // Spawn the command
        let mut child = command.spawn().context(format!("Failed to execute: {}", cmd.name))?;

        if !is_last {
            // Save stdout for next command
            prev_stdout = child.stdout.take();
        }

        // Wait for the last command
        if is_last {
            let status = child.wait()?;
            if !status.success() {
                // Return error code but don't fail
                return Ok(());
            }
        }
    }

    Ok(())
}

/// Execute a single command with redirections
fn execute_single(cmd: &crate::parser::Command) -> Result<()> {
    let mut command = Command::new(&cmd.name);
    command.args(&cmd.args);

    // Handle stdin redirection
    if let Some(ref file) = cmd.stdin_redirect {
        let f = File::open(file).context(format!("Failed to open input file: {}", file))?;
        command.stdin(Stdio::from(f));
    }

    // Handle stdout redirection
    if let Some((ref file, append)) = cmd.stdout_redirect {
        let f = if append {
            OpenOptions::new().create(true).append(true).open(file)?
        } else {
            File::create(file)?
        };
        command.stdout(Stdio::from(f));
    }

    // Handle stderr redirection
    if let Some(ref file) = cmd.stderr_redirect {
        let f = File::create(file).context(format!("Failed to create error file: {}", file))?;
        command.stderr(Stdio::from(f));
    }

    // Execute and wait
    let status = command.status().context(format!("Failed to execute: {}", cmd.name))?;

    if !status.success() {
        if let Some(code) = status.code() {
            std::process::exit(code);
        }
    }

    Ok(())
}
