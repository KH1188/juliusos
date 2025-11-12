use anyhow::Result;
use clap::{Parser, Subcommand};
use std::process;

mod daemon;
mod service;
mod cli;
mod config;

#[derive(Parser)]
#[command(name = "juinit")]
#[command(about = "JuliOS Init System", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Start a service
    Start {
        /// Name of the service
        service: String,
    },
    /// Stop a service
    Stop {
        /// Name of the service
        service: String,
    },
    /// Restart a service
    Restart {
        /// Name of the service
        service: String,
    },
    /// Show service status
    Status {
        /// Name of the service (optional, shows all if not provided)
        service: Option<String>,
    },
    /// List all services
    List,
    /// Enable service at boot
    Enable {
        /// Name of the service
        service: String,
    },
    /// Disable service at boot
    Disable {
        /// Name of the service
        service: String,
    },
    /// View service logs
    Logs {
        /// Name of the service
        service: String,
        /// Follow log output
        #[arg(short, long)]
        follow: bool,
    },
    /// Reload daemon configuration
    DaemonReload,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Check if we're running as PID 1
    let pid = process::id();

    if pid == 1 {
        // We're the init process - run the daemon
        tracing::info!("juinit starting as PID 1");
        daemon::run().await?;
    } else {
        // We're a client command - parse and execute
        let cli = Cli::parse();

        match cli.command {
            Some(Commands::Start { service }) => {
                cli::start_service(&service).await?;
            }
            Some(Commands::Stop { service }) => {
                cli::stop_service(&service).await?;
            }
            Some(Commands::Restart { service }) => {
                cli::restart_service(&service).await?;
            }
            Some(Commands::Status { service }) => {
                cli::show_status(service.as_deref()).await?;
            }
            Some(Commands::List) => {
                cli::list_services().await?;
            }
            Some(Commands::Enable { service }) => {
                cli::enable_service(&service).await?;
            }
            Some(Commands::Disable { service }) => {
                cli::disable_service(&service).await?;
            }
            Some(Commands::Logs { service, follow }) => {
                cli::show_logs(&service, follow).await?;
            }
            Some(Commands::DaemonReload) => {
                cli::reload_daemon().await?;
            }
            None => {
                println!("juinit - JuliOS Init System");
                println!("Run 'juinit --help' for usage information");
            }
        }
    }

    Ok(())
}
