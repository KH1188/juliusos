use anyhow::Result;
use rustyline::error::ReadlineError;
use rustyline::DefaultEditor;
use std::env;
use std::process::Command;

mod builtins;
mod parser;
mod executor;

fn main() -> Result<()> {
    // Check if we're running a script
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        // Execute script file
        println!("Script execution not yet implemented");
        return Ok(());
    }

    // Start interactive REPL
    run_repl()
}

fn run_repl() -> Result<()> {
    let mut rl = DefaultEditor::new()?;

    // Load history if it exists
    let history_path = dirs::home_dir()
        .map(|mut p| {
            p.push(".jush_history");
            p
        });

    if let Some(ref path) = history_path {
        let _ = rl.load_history(path);
    }

    println!("jush - JuliOS Shell v0.1.0");
    println!("Type 'help' for commands, 'exit' to quit\n");

    loop {
        let prompt = get_prompt();
        let readline = rl.readline(&prompt);

        match readline {
            Ok(line) => {
                let line = line.trim();

                if line.is_empty() {
                    continue;
                }

                // Add to history
                let _ = rl.add_history_entry(line);

                // Execute command
                if let Err(e) = execute_line(line) {
                    eprintln!("jush: {}", e);
                }
            }
            Err(ReadlineError::Interrupted) => {
                println!("^C");
                continue;
            }
            Err(ReadlineError::Eof) => {
                println!("exit");
                break;
            }
            Err(err) => {
                eprintln!("Error: {:?}", err);
                break;
            }
        }
    }

    // Save history
    if let Some(ref path) = history_path {
        let _ = rl.save_history(path);
    }

    Ok(())
}

fn get_prompt() -> String {
    let user = env::var("USER").unwrap_or_else(|_| "user".to_string());
    let hostname = hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "julios".to_string());
    let cwd = env::current_dir()
        .ok()
        .and_then(|p| p.to_str().map(String::from))
        .unwrap_or_else(|| "~".to_string());

    format!("{}@{}:{}$ ", user, hostname, cwd)
}

fn execute_line(line: &str) -> Result<()> {
    // Parse the command
    let parts: Vec<&str> = line.split_whitespace().collect();

    if parts.is_empty() {
        return Ok(());
    }

    let cmd = parts[0];
    let args = &parts[1..];

    // Check for built-in commands
    match cmd {
        "exit" | "quit" => {
            std::process::exit(0);
        }
        "cd" => {
            builtins::cd(args)?;
        }
        "pwd" => {
            builtins::pwd()?;
        }
        "echo" => {
            builtins::echo(args)?;
        }
        "export" => {
            builtins::export(args)?;
        }
        "help" => {
            builtins::help();
        }
        // JuliOS-specific commands
        "task" => {
            println!("Task management not yet implemented");
            println!("This will integrate with JuliOS API");
        }
        "habit" => {
            println!("Habit tracking not yet implemented");
            println!("This will integrate with JuliOS API");
        }
        "ask" => {
            println!("AI assistant not yet implemented");
            println!("This will integrate with JuliOS agent service");
        }
        _ => {
            // Execute external command
            execute_external(cmd, args)?;
        }
    }

    Ok(())
}

fn execute_external(cmd: &str, args: &[&str]) -> Result<()> {
    let output = Command::new(cmd)
        .args(args)
        .output();

    match output {
        Ok(output) => {
            // Print stdout
            if !output.stdout.is_empty() {
                print!("{}", String::from_utf8_lossy(&output.stdout));
            }

            // Print stderr
            if !output.stderr.is_empty() {
                eprint!("{}", String::from_utf8_lossy(&output.stderr));
            }

            // Check exit status
            if !output.status.success() {
                if let Some(code) = output.status.code() {
                    std::process::exit(code);
                }
            }

            Ok(())
        }
        Err(e) => {
            Err(anyhow::anyhow!("command not found: {}", cmd))
        }
    }
}
