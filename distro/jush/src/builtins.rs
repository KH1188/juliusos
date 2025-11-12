use anyhow::Result;
use std::env;
use std::path::Path;

/// Change directory
pub fn cd(args: &[&str]) -> Result<()> {
    let path = if args.is_empty() {
        // No args - go to home directory
        dirs::home_dir()
            .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?
    } else {
        Path::new(args[0]).to_path_buf()
    };

    env::set_current_dir(&path)
        .map_err(|e| anyhow::anyhow!("cd: {}: {}", path.display(), e))?;

    Ok(())
}

/// Print working directory
pub fn pwd() -> Result<()> {
    let cwd = env::current_dir()?;
    println!("{}", cwd.display());
    Ok(())
}

/// Echo arguments
pub fn echo(args: &[&str]) -> Result<()> {
    println!("{}", args.join(" "));
    Ok(())
}

/// Export environment variable
pub fn export(args: &[&str]) -> Result<()> {
    if args.is_empty() {
        // Print all environment variables
        for (key, value) in env::vars() {
            println!("{}={}", key, value);
        }
        return Ok(());
    }

    for arg in args {
        if let Some((key, value)) = arg.split_once('=') {
            env::set_var(key, value);
        } else {
            return Err(anyhow::anyhow!("export: invalid syntax"));
        }
    }

    Ok(())
}

/// Show help
pub fn help() {
    println!("jush - JuliOS Shell");
    println!();
    println!("Built-in Commands:");
    println!("  cd [dir]          Change directory");
    println!("  pwd               Print working directory");
    println!("  echo [args...]    Print arguments");
    println!("  export VAR=value  Set environment variable");
    println!("  help              Show this help");
    println!("  exit              Exit the shell");
    println!();
    println!("JuliOS Commands (Coming Soon):");
    println!("  task              Task management");
    println!("  habit             Habit tracking");
    println!("  health            Health metrics");
    println!("  journal           Journal entries");
    println!("  note              Note taking");
    println!("  ask               AI assistant");
    println!("  digest            Daily digest");
    println!();
    println!("External commands are executed via the system PATH.");
}
