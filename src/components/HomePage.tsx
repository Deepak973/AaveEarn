"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { SupplyAssetsList } from "@/components/ui/supply/SupplyAssetsList";
import { YourSupplies } from "@/components/ui/supply/YourSupplies";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useChainId,
} from "wagmi";
import {
  Tabs,
  Tab,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  Grid,
  IconButton,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Close } from "@mui/icons-material";
import { useAppDataContext } from "~/hooks/app-data-provider/useAppDataProvider";
import { useMiniApp } from "@neynar/react";
import { useDetectClickOutside } from "~/hooks/useDetectClickOutside";
import { truncateAddress } from "../lib/truncateAddress";

// Custom styled components
const CustomTabs = styled(Tabs)({
  "& .MuiTabs-indicator": {
    backgroundColor: "#6B7280",
  },
});

const CustomTab = styled(Tab)({
  color: "rgba(229, 231, 235, 0.7)",
  fontSize: "0.875rem",
  fontWeight: 500,
  "&.Mui-selected": {
    color: "#e5e7eb",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  "&:hover": {
    color: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});

const StatsCard = styled(Card)(({ theme }) => ({
  background: "var(--secondary-bg)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  borderRadius: "12px",
}));

const GlassNav = styled("div")({
  position: "sticky",
  top: 0,
  zIndex: 30,
  width: "100%",
  background: "rgba(15, 17, 22, 0.7)",
  backdropFilter: "blur(8px)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
});

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [earnAnimateIn, setEarnAnimateIn] = useState(false);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { user, loading: loadingUser } = useAppDataContext();
  const { context, actions, added } = useMiniApp();
  const { disconnect } = useDisconnect();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  useDetectClickOutside(profileRef, () => setProfileOpen(false));
  const [copied, setCopied] = useState(false);
  const { switchChain } = useSwitchChain();
  const [showLogo, setShowLogo] = useState(true);
  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: 8453 });
  }, [switchChain]);
  const chainId = useChainId();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
    setTimeout(() => setEarnAnimateIn(true), 10);
  };

  const handleCloseModal = () => {
    setEarnAnimateIn(false);
    setTimeout(() => setIsModalOpen(false), 220);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLogo((prev) => !prev);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Automatically prompt to add frame to client if not already added
    if (context && !added) {
      actions.addMiniApp();
    }
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center">
          <div
            className="w-10 h-10 mx-auto mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setShowLogo((prev) => !prev)}
          >
            {showLogo ? (
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src="/back.png"
                alt="Back"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <h1 className="text-xl font-semibold text-text-secondary mb-2">
            Earn on Aave
          </h1>
          <p className="text-text-primary mb-6 text-sm">
            Connect your wallet to start earning yield
          </p>
        </div>

        {context?.user?.pfpUrl && (
          <div className="absolute top-4 right-4">
            <img
              src={context.user.pfpUrl}
              alt="Profile"
              className="w-10 h-10 rounded-lg border border-subtle object-cover"
            />
          </div>
        )}

        <Button
          variant="contained"
          size="medium"
          onClick={() => connect({ connector: connectors[0] })}
          sx={{
            background: "#1f2937",
            color: "#e5e7eb",
            px: 3,
            py: 1.25,
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "8px",
            "&:hover": { background: "#2b3444" },
          }}
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (isConnected && chainId !== 8453) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center">
          <div
            className="w-10 h-10 mx-auto mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setShowLogo((prev) => !prev)}
          >
            {showLogo ? (
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src="/back.png"
                alt="Back"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <h1 className="text-xl font-semibold text-text-secondary mb-2">
            Wrong Network
          </h1>

          <p className="text-text-primary mb-6 text-sm">
            Please switch to Base network to use Earn on Aave
          </p>
        </div>

        {context?.user?.pfpUrl && (
          <div className="absolute top-4 right-4">
            <img
              src={context.user.pfpUrl}
              alt="Profile"
              className="w-10 h-10 rounded-lg border border-subtle object-cover"
            />
          </div>
        )}

        <Button
          variant="contained"
          size="medium"
          onClick={handleSwitchChain}
          sx={{
            background: "#1f2937",
            color: "#e5e7eb",
            px: 3,
            py: 1.25,
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "8px",
            "&:hover": { background: "#2b3444" },
          }}
        >
          Switch to Base
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-primary">
      <GlassNav>
        <div className="container mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 mx-auto mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => setShowLogo((prev) => !prev)}
            >
              {showLogo ? (
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src="/back.png"
                  alt="Back"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <span className="text-sm text-text-secondary font-semibold">
              Earn on Aave
            </span>
          </div>

          {context?.user?.pfpUrl && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <img
                  src={context.user.pfpUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-lg border border-subtle object-cover"
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-secondary border border-subtle rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-subtle space-y-1">
                    <p className="text-xs text-text-primary">Account</p>
                    {isConnected && address ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-text-secondary">
                          {truncateAddress(address)}
                        </span>

                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(address);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1200);
                            } catch {}
                          }}
                          className="text-[11px] px-2 py-0.5 rounded bg-[#111318] text-text-secondary hover:bg-[#1a1d24]"
                        >
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary">Signed out</p>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    {connectors?.[0] && (
                      <button
                        onClick={() => {
                          connect({ connector: connectors[0] });
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-[#111318] rounded"
                      >
                        Connect Farcaster
                      </button>
                    )}
                    {connectors?.[1] && (
                      <button
                        onClick={() => {
                          connect({ connector: connectors[1] });
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-[#111318] rounded"
                      >
                        Connect Coinbase Wallet
                      </button>
                    )}
                    {connectors?.[2] && (
                      <button
                        onClick={() => {
                          connect({ connector: connectors[2] });
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-[#111318] rounded"
                      >
                        Connect MetaMask
                      </button>
                    )}
                  </div>
                  <div className="border-t border-subtle" />
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      disconnect();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-[#111318]"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassNav>

      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleCardClick}
            className="text-left p-3 rounded-lg border"
            style={{
              background: "var(--secondary-bg)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-xs text-text-primary mb-1">Net Worth</div>
            <div className="text-sm text-text-secondary font-semibold">
              {loadingUser
                ? "..."
                : `$${
                    user?.netWorthUSD ? (+user.netWorthUSD).toFixed(2) : "0.00"
                  }`}
            </div>
          </button>

          <button
            onClick={handleCardClick}
            className="text-left p-3 rounded-lg border"
            style={{
              background: "var(--secondary-bg)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-xs text-text-primary mb-1">Net APY</div>
            <div className="text-sm text-text-secondary font-semibold">
              {loadingUser
                ? "..."
                : user?.netAPY
                ? `${(user.netAPY * 100).toFixed(2)}%`
                : "0.00%"}
            </div>
          </button>
        </div>

        <div className="mb-6">
          <Box
            sx={{
              background: "var(--secondary-bg)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              p: 1,
            }}
          >
            <CustomTabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <CustomTab
                label={
                  <div className="flex items-center gap-2">Your Supplies</div>
                }
              />
              <CustomTab
                label={
                  <div className="flex items-center gap-2">Supply asset</div>
                }
              />
            </CustomTabs>
          </Box>
        </div>

        <div>{currentTab === 0 ? <YourSupplies /> : <SupplyAssetsList />}</div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
        }}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div
          className={`w-full max-w-5xl h-[100vh] rounded-t-xl border border-subtle p-4 md:p-6 bg-[var(--secondary-bg)] text-[var(--text-secondary)] transform transition-transform duration-300 ease-out ${
            earnAnimateIn ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <Typography
              variant="h6"
              sx={{ color: "white", fontWeight: 600, fontSize: "1.05rem" }}
            >
              Earning
            </Typography>
            <IconButton
              onClick={handleCloseModal}
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </div>

          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              mb: 2,
              fontSize: "0.95rem",
            }}
          >
            Put your crypto to work. Supply assets to earn interest from
            borrowers.
          </Typography>

          <div className="space-y-3 overflow-y-auto h-[calc(100vh-96px)] pr-1">
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <div className="flex items-center justify-between">
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                    }}
                  >
                    Net Worth
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1.05rem",
                    }}
                  >
                    {loadingUser
                      ? "..."
                      : `$${
                          user?.netWorthUSD
                            ? (+user.netWorthUSD).toFixed(2)
                            : "0.00"
                        }`}
                  </Typography>
                </div>

                {/* Small description below */}
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.8rem",
                    mt: 1,
                  }}
                >
                  The total amount invested with interest accumulated.
                </Typography>
              </CardContent>
            </StatsCard>

            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <div className="flex items-center justify-between">
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                    }}
                  >
                    Net APY
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1.05rem",
                    }}
                  >
                    {loadingUser
                      ? "..."
                      : user?.netAPY
                      ? `${(user.netAPY * 100).toFixed(2)}%`
                      : "0%"}
                  </Typography>
                </div>

                {/* Small description below */}
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.8rem",
                    mt: 1,
                  }}
                >
                  The weighted net annual percentage yield of all your assets
                  combined.
                </Typography>
              </CardContent>
            </StatsCard>

            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                mb: 2,
                fontSize: "0.95rem",
              }}
            >
              Where does the yield come from?
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                mb: 2,
                fontSize: "0.95rem",
              }}
            >
              When you supply assets on Aave, you’re basically lending them into
              a shared liquidity pool. Borrowers can then take loans from this
              pool by paying interest. The interest paid by borrowers is
              distributed back to the suppliers as yield. In simple terms: your
              deposits earn yield because other users are borrowing and paying
              interest on those same assets.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCloseModal}
              sx={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "white",
                py: 1.1,
                fontSize: "0.95rem",
                fontWeight: 600,
                borderRadius: "10px",
                mt: 3,
                "&:hover": { background: "rgba(255, 255, 255, 0.12)" },
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
