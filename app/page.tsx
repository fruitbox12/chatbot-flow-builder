"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  getConnectedEdges,
} from "reactflow";
import "reactflow/dist/style.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SettingsPanel } from "@/components/sections/SettingsPanel";
import { notifyError, notifySuccess } from "@/components/Helpers/Notification";
import {
  initNodes,
  nodeTypes,
} from "@/components/constants/WorkflowNodeConstants";

let id = 1;
const getId = () => `${id++}`;

export default function Homepage() {
  // Reference for the flow wrapper
  const reactFlowWrapper = useRef<any>(null);

  // States provided by React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // React State to store Saved Workflows
  const [saved, setSaved] = useState<any>();

  // React state to store the currently selected Node
  const [selectedNode, setSelectedNode] = useState("");

  // React State to store Messages
  const [nodeMessages, setNodeMessages] = useState<any>([
    { id: "0", message: "Initial Node" },
  ]);

  // Function to handle edge connections
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // This function is called when there is a change in [nodeMessages, setNodes, selectedNode] values to
  // recompute the Nodes when there is a change in any of the following states
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node: any) => {
        let message = connectToMessage(node.data.id);
        node.data = {
          ...node.data,
          selectedNode: selectedNode,
          setSelectedNode: setSelectedNode,
          message: message,
        };

        return node;
      })
    );
  }, [nodeMessages, setNodes, selectedNode]);

  // This function acts as a connection between the nodeMessages Array and the state of the Nodes
  const connectToMessage = (id: any) => {
    let message = "";
    nodeMessages.map((msg: any) => {
      if (id === msg.id) {
        message = msg.message;
      }
    });
    return message;
  };

  // This function is used to filter the Messages Array when a Node is Deleted
  const onNodesDelete = useCallback(
    (deleted: any) => {
      let msgArray: any = [];
      nodeMessages.map((msg: any) => {
        if (deleted[0].data.id !== msg.id) {
          msgArray.push(msg);
        } else {
          msgArray.push({ id: msg.id, message: "" });
        }
      });
      setNodeMessages(msgArray);
    },
    [nodes, edges]
  );

  // This function handles the change Message Values
  const handleChangeMessage = (e: any) => {
    let newStack: any = [];
    nodeMessages.map((value: any) => {
      if (value.id === selectedNode) {
        newStack.push({ id: value.id, message: e.target.value });
      } else {
        newStack.push(value);
      }
    });
    setNodeMessages(newStack);
  };

  // Drag And Drop Handlers Start
  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = (event: any) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData("application/reactflow");

    // Check if the dropped element is valid
    if (typeof type === "undefined" || !type) {
      return;
    }

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const id = getId();
    let message = `Message ${id}`;
    let msgArray: any = nodeMessages;
    msgArray.push({ id: id, message: message });
    setNodeMessages(msgArray);
    const newNode = {
      id: id,
      type,
      position,
      data: {
        id: id,
        message: message,
        selectedNode: selectedNode,
        setSelectedNode: setSelectedNode,
      },
    };

    setNodes((nds: any) => nds.concat(newNode));
  };

  const onDragStart = (event: any, nodeType: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };
  // Drag And Drop Handlers End

  // Save Reset and Load Handlers Start
  const saveHandler = () => {
    if (nodes.length === 1) {
      setSaved({
        nodes: nodes,
        edges: edges,
        nodeMessages: nodeMessages,
        id: id,
      });
      notifySuccess("Saved Successfully");
    } else {
      let errorFound = 0;
      nodes.map((node) => {
        const connectedEdges = getConnectedEdges([node], edges);
        if (connectedEdges.length === 0) {
          errorFound++;
        }
      });
      if (errorFound > 0) {
        notifyError("Cannot Save Flow");
      } else {
        setSaved({
          nodes: nodes,
          edges: edges,
          nodeMessages: nodeMessages,
          id: id,
        });
        notifySuccess("Saved Successfully");
      }
    }
  };

  const resetHandler = () => {
    try {
      setNodes(initNodes);
      setEdges([]);
      setNodeMessages([{ id: "0", message: "Initial Node" }]);
      setSelectedNode("");
      id = 1;
      notifySuccess("Reset Successfully");
    } catch (e) {
      notifyError("Failed");
    }
  };

  const loadHandler = () => {
    try {
      setNodes(saved.nodes);
      setEdges(saved.edges);
      setNodeMessages(saved.nodeMessages);
      setSelectedNode("");
      id = saved.id;
      notifySuccess("Load Success");
    } catch (e) {
      notifyError("Failed");
    }
  };
  // Save Reset and Load Handlers End
// Function to execute the workflow
const executeWorkflow = async () => {
  // Disable the button during execution
  setIsExecuting(true);

  // Iterate through nodes and perform HTTP requests
  for (const node of nodes) {
    if (node.type === "httpRequest") {
      try {
        // Make the HTTP request here
        const response = await fetch(node.data.url, {
          method: node.data.method,
          // Add headers and body as needed
        });

        // Check for success or handle errors
        if (response.ok) {
          // HTTP request was successful
          const responseData = await response.json();
          // Handle the response data as needed
          console.log("HTTP request successful:", responseData);
        } else {
          // HTTP request failed, handle the error
          console.error("HTTP request failed:", response.statusText);
          // You can add additional error handling logic here
        }
      } catch (error) {
        // An error occurred during the HTTP request
        console.error("An error occurred during the HTTP request:", error);
        // You can add additional error handling logic here
      }
    }
  }

  // Enable the button after execution
  setIsExecuting(false);
};
