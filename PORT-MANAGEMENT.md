# Port Management - WebHook UI Desktop

## Port Usage Strategy

The desktop app is designed to coexist with the web version by using different ports:

### Port Allocation

- **Web Version**: Uses port **3001** (your existing setup)
- **Desktop Version**: Uses port **3002** (default) with automatic fallback

### Automatic Port Detection

The desktop app includes smart port management:

1. **Primary Port**: Tries port 3002 first
2. **Fallback Ports**: If 3002 is busy, automatically tries ports 3003-3012
3. **Dynamic Updates**: Frontend automatically updates to use the working port
4. **Status Indication**: Connection status shows which port is being used

### Port Conflict Resolution

**Scenario 1**: Web version running on 3001
- ✅ Desktop app starts on 3002 - **No conflict!**

**Scenario 2**: Something else using 3002
- ✅ Desktop app automatically finds next available port (3003, 3004, etc.)

**Scenario 3**: Multiple desktop instances
- ✅ Each instance gets its own port automatically

### Technical Implementation

```javascript
// Desktop app tries ports in sequence:
Port 3002 (primary)
Port 3003 (fallback 1)
Port 3004 (fallback 2)
... up to 3012
```

### Verification

You can verify which ports are in use:

**Windows PowerShell:**
```powershell
netstat -an | findstr :300
```

**Command Prompt:**
```cmd
netstat -an | find ":300"
```

This will show:
- `:3001` - Web version proxy
- `:3002` - Desktop version proxy (or next available)

### Benefits

1. **No Manual Configuration**: Everything handled automatically
2. **No Conflicts**: Web and desktop versions work simultaneously
3. **Resilient**: Works even if other apps use nearby ports
4. **Transparent**: User doesn't need to know about ports

### Troubleshooting

If connection issues occur:
1. Check the desktop app console for port messages
2. Verify no firewall blocking ports 3002-3012
3. Restart the desktop app to retry port detection

The desktop app is designed to "just work" alongside your existing web setup! 🚀
